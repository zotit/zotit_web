import { writable } from 'svelte/store';
import { loadAuth } from './storage';

export type AuthState = {
  ready: boolean;
  authed: boolean;
  username: string;
};

export const auth = writable<AuthState>({ ready: false, authed: false, username: '' });

export async function syncAuth() {
  const a = await loadAuth();
  auth.set({
    ready: true,
    authed: !!a?.token,
    username: a?.username ?? '',
  });
}

// Keep store in sync when storage helper updates auth
window.addEventListener('zotit-auth-changed', () => {
  void syncAuth();
});

