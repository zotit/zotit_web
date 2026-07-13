import { writable } from 'svelte/store';
import { loadAuth } from './storage';

type ThemeMode = 'dark' | 'light';

const KEY = 'zotit_theme';

export const theme = writable<ThemeMode>('dark');

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

async function getStored(): Promise<ThemeMode | null> {
  if (hasChromeStorage()) {
    const res = await chrome.storage.local.get([KEY]);
    const v = res[KEY];
    return v === 'light' || v === 'dark' ? v : null;
  }
  const v = localStorage.getItem(KEY);
  return v === 'light' || v === 'dark' ? v : null;
}

async function setStored(mode: ThemeMode): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [KEY]: mode });
  } else {
    localStorage.setItem(KEY, mode);
  }
}

export async function initTheme() {
  const stored = await getStored();
  applyTheme(stored ?? 'dark');
}

export function currentTheme(): ThemeMode {
  return document.body.dataset.theme === 'light' ? 'light' : 'dark';
}

export async function toggleTheme() {
  const next: ThemeMode = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  await setStored(next);
}

export function applyTheme(mode: ThemeMode) {
  document.body.dataset.theme = mode;
  theme.set(mode);
}

