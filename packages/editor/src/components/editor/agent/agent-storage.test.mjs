import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadTypeScript } from '../../../../tests/load-typescript.mjs';
const filename = fileURLToPath(new URL('./agent-storage.ts', import.meta.url));
const settings = { baseUrl: 'https://example.com/v1', apiKey: 'test-key-only', model: 'fixture' };
function memory(initial = {}) { const data = new Map(Object.entries(initial)); return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; }
function setup({ desktop = false, failSave = false, legacy = true } = {}) {
  const values = new Map();
  const localStorage = memory(legacy ? { 'bluepen:ai-settings': JSON.stringify(settings) } : {});
  const sessionStorage = memory();
  const idb = { open() {
    const request = {};
    request.result = { close() {}, transaction(_name, mode) {
      const tx = {}; let value, key;
      tx.objectStore = () => ({ get(k) { return { result: values.get(k) }; }, put(v,k) {value=v;key=k;} });
      queueMicrotask(() => { if (mode === 'readwrite' && failSave) tx.onabort(); else { if (mode === 'readwrite') values.set(key,value); tx.oncomplete(); } });
      return tx;
    }};
    queueMicrotask(() => request.onsuccess()); return request;
  }};
  const store = loadTypeScript(filename, { mocks: {
    '../hooks/use-desktop': { isDesktop: () => desktop },
    '@tauri-apps/plugin-store': { load: async () => { const draft = new Map(); return { get: async k => values.get(k), set: async (k,v) => draft.set(k,v), save: async () => { if (failSave) throw new Error('disk full'); for (const [k,v] of draft) values.set(k,v); draft.clear(); } }; } },
  }, globals: { indexedDB: idb, localStorage, sessionStorage } });
  return { store, values, localStorage, sessionStorage };
}

test('Web migration moves key to tab session storage and persists public settings only', async () => {
  const state = setup(); const result = await state.store.loadAgentSettings();
  assert.equal(result.apiKey, settings.apiKey);
  assert.equal(state.sessionStorage.getItem('bluepen:agent-key'), settings.apiKey);
  assert.equal(state.localStorage.getItem('bluepen:ai-settings'), null);
  assert.ok(!JSON.stringify([...state.values]).includes(settings.apiKey));
});

test('failed migration retains the only legacy credential and restores previous session key', async () => {
  const state = setup({ failSave: true });
  await assert.rejects(state.store.loadAgentSettings());
  assert.ok(state.localStorage.getItem('bluepen:ai-settings'));
  assert.equal(state.sessionStorage.getItem('bluepen:agent-key'), null);
});

test('desktop keeps the credential in the local settings file instead of the OS keychain', async () => {
  const state = setup({ desktop: true }); const loaded = await state.store.loadAgentSettings();
  assert.equal(loaded.apiKey, settings.apiKey);
  assert.equal(state.values.get('settings').apiKey, settings.apiKey);
  assert.equal(state.localStorage.getItem('bluepen:ai-settings'), null);
  await state.store.saveAgentSettings({ ...settings, apiKey: 'rotated-key' });
  assert.equal((await state.store.loadAgentSettings()).apiKey, 'rotated-key');
  await state.store.saveAgentSettings({ ...settings, apiKey: '' });
  assert.equal((await state.store.loadAgentSettings()).apiKey, '');
});

test('desktop history never stores the credential and recovery is kept separate', async () => {
  const state = setup({ desktop: true, legacy: false });
  await state.store.saveAgentSettings(settings);
  await state.store.agentStorage.saveHistory({ version: 1, sessions: [], selected: {} });
  assert.ok(!JSON.stringify(state.values.get('history')).includes(settings.apiKey));
  const raw = { version: 1, sessions: [{ broken: true }], selected: {} };
  await state.store.agentStorage.saveHistoryRecovery(raw);
  assert.deepEqual(state.values.get('historyRecovery').raw, raw);
  assert.ok(!JSON.stringify(state.values.get('historyRecovery')).includes(settings.apiKey));
});

test('a failed desktop settings write reports the failure instead of silently keeping the key', async () => {
  const state = setup({ desktop: true, legacy: false, failSave: true });
  await assert.rejects(state.store.saveAgentSettings(settings));
  assert.equal((await state.store.loadAgentSettings()).apiKey, '');
});

test('protocol and thinking choices survive reload without persisting credentials', async () => {
  const state = setup({ legacy: false });
  await state.store.saveAgentSettings({ ...settings, protocol: 'chat-completions', thinking: 'high' });
  const loaded = await state.store.loadAgentSettings();
  assert.equal(loaded.protocol, 'chat-completions');
  assert.equal(loaded.thinking, 'high');
  assert.equal(loaded.apiKey, settings.apiKey);
  assert.ok(!JSON.stringify([...state.values]).includes(settings.apiKey));
});
