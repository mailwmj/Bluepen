import { isDesktop } from '../hooks/use-desktop';
import { defaultAgentSettings, type AgentHistory, type AgentSettings } from './agent-types';

const LEGACY_KEY = 'bluepen:ai-settings';
const SESSION_KEY = 'bluepen:agent-key';
const RECOVERY_KEY = 'historyRecovery';

async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('bluepen_agent', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('data');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('无法打开任务存储，请检查浏览器存储权限'));
  });
}

async function read<T>(key: string): Promise<T | undefined> {
  if (isDesktop()) {
    const { load } = await import('@tauri-apps/plugin-store');
    return (await load('agent.json', { autoSave: false })).get<T>(key);
  }
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readonly');
    const request = tx.objectStore('data').get(key);
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error('读取任务失败，请重试')); };
  });
}

async function write(key: string, value: unknown): Promise<void> {
  if (isDesktop()) {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load('agent.json', { autoSave: false });
    await store.set(key, value);
    await store.save();
    return;
  }
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite');
    tx.objectStore('data').put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error('本地保存失败，请检查存储权限或剩余空间')); };
  });
}

/**
 * Desktop credentials live in the same local file as the rest of the AI settings. The OS keychain is
 * deliberately avoided: the bundle is ad-hoc signed, so every release has a new code identity and
 * macOS treats it as a stranger, blocking launch behind a login-keychain password prompt.
 * Browsers have no equivalent durable store here, so the key survives only for the current tab.
 */
export async function saveAgentSettings(settings: AgentSettings) {
  const shared = {
    baseUrl: settings.baseUrl.trim(),
    model: settings.model.trim(),
    protocol: settings.protocol ?? 'responses',
    thinking: settings.thinking ?? 'default',
  };
  const apiKey = settings.apiKey.trim();
  if (isDesktop()) {
    await write('settings', { ...shared, apiKey });
  } else {
    await write('settings', { ...shared, apiKey: '' });
    if (apiKey) sessionStorage.setItem(SESSION_KEY, apiKey);
    else sessionStorage.removeItem(SESSION_KEY);
  }
  localStorage.removeItem(LEGACY_KEY);
}

export async function loadAgentSettings(): Promise<AgentSettings> {
  const saved = await read<Partial<AgentSettings>>('settings');
  const storedKey = typeof saved?.apiKey === 'string' ? saved.apiKey : '';
  const apiKey = isDesktop() ? storedKey : sessionStorage.getItem(SESSION_KEY) ?? '';
  const raw = localStorage.getItem(LEGACY_KEY);
  if (raw && !saved) {
    let legacy: Partial<AgentSettings>;
    try { legacy = JSON.parse(raw); } catch { throw new Error('旧 AI 设置损坏，请在设置页面重新保存'); }
    const migrated = {
      baseUrl: typeof legacy.baseUrl === 'string' ? legacy.baseUrl : defaultAgentSettings.baseUrl,
      model: typeof legacy.model === 'string' ? legacy.model : defaultAgentSettings.model,
      apiKey: typeof legacy.apiKey === 'string' ? legacy.apiKey : '',
    };
    await saveAgentSettings(migrated);
    return migrated;
  }
  // Finish cleanup if the previous migration committed but cleanup was interrupted.
  if (saved && raw) localStorage.removeItem(LEGACY_KEY);
  return {
    baseUrl: typeof saved?.baseUrl === 'string' ? saved.baseUrl : defaultAgentSettings.baseUrl,
    model: typeof saved?.model === 'string' ? saved.model : defaultAgentSettings.model,
    apiKey,
    protocol: saved?.protocol === 'chat-completions' ? 'chat-completions' : 'responses',
    thinking: saved?.thinking === 'high' || saved?.thinking === 'off' ? saved.thinking : 'default',
  };
}

export const agentStorage = {
  loadHistory: () => read<AgentHistory>('history'),
  saveHistory: (history: AgentHistory) => write('history', history),
  /** Unreadable entries are dropped on load, so keep the untouched record before it is overwritten. */
  saveHistoryRecovery: (raw: unknown) => write(RECOVERY_KEY, { at: Date.now(), raw }),
  loadSettings: loadAgentSettings,
  saveSettings: saveAgentSettings,
};
