import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadTypeScript } from '../../../../tests/load-typescript.mjs';
const filename = fileURLToPath(new URL('./agent-storage.ts', import.meta.url));
const settings = { baseUrl: 'https://example.com/v1', apiKey: 'test-key-only', model: 'fixture' };
function memory(initial = {}) { const data = new Map(Object.entries(initial)); return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; }
function setup({ desktop = false, failKey = false, failSave = false, legacy = true } = {}) {
  const values = new Map(); const key = { value: '' }; const commands = [];
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
    '@tauri-apps/api/core': { invoke: async (command, args) => { commands.push(command); if (failKey) throw new Error('keychain unavailable'); if (command === 'write_agent_key') key.value=args.apiKey; return key.value; } },
    '@tauri-apps/plugin-store': { load: async () => ({ get: async k => values.get(k), set: async (k,v) => values.set(k,v), save: async () => { if (failSave) throw new Error('disk full'); } }) },
  }, globals: { indexedDB: idb, localStorage, sessionStorage } });
  return { store, values, key, localStorage, sessionStorage, commands };
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

test('desktop credentials use native commands; neither settings nor history store the key', async () => {
  const state = setup({ desktop: true }); await state.store.loadAgentSettings();
  assert.equal(state.key.value, settings.apiKey); assert.ok(state.commands.includes('write_agent_key'));
  assert.ok(!JSON.stringify([...state.values]).includes(settings.apiKey));
  assert.equal(state.localStorage.getItem('bluepen:ai-settings'), null);
  await state.store.saveAgentSettings({ ...settings, apiKey: '' }); assert.equal(state.key.value, '');
});

test('inaccessible desktop keychain does not remove the legacy key', async () => {
  const state = setup({ desktop: true, failKey: true }); await assert.rejects(state.store.loadAgentSettings());
  assert.ok(state.localStorage.getItem('bluepen:ai-settings')); assert.equal(state.values.size, 0);
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
