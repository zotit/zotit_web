export type StoredAuth = {
  token: string;
  refresh_token: string;
  username?: string;
};

type StorageLike = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

const storage: StorageLike = hasChromeStorage()
  ? {
      get: async (key) => {
        const res = await chrome.storage.local.get([key]);
        const val = res[key];
        return typeof val === 'string' ? val : null;
      },
      set: async (key, value) => {
        await chrome.storage.local.set({ [key]: value });
      },
      remove: async (key) => {
        await chrome.storage.local.remove([key]);
      },
    }
  : {
      get: async (key) => localStorage.getItem(key),
      set: async (key, value) => localStorage.setItem(key, value),
      remove: async (key) => localStorage.removeItem(key),
    };

const AUTH_KEY = 'zotit_auth';

export async function loadAuth(): Promise<StoredAuth | null> {
  const raw = await storage.get(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export async function saveAuth(auth: StoredAuth): Promise<void> {
  await storage.set(AUTH_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event('zotit-auth-changed'));
}

export async function clearAuth(): Promise<void> {
  await storage.remove(AUTH_KEY);
  window.dispatchEvent(new Event('zotit-auth-changed'));
}

