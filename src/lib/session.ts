import { apiBase } from '../env';
import { clearAuth, loadAuth, saveAuth, type StoredAuth } from './storage';

const REFRESH_SKEW_MS = 5 * 60 * 1000; // refresh 5 min before access token expires

let refreshPromise: Promise<boolean> | null = null;

function parseJwtExp(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export function accessTokenExpiresSoon(token: string, skewMs = REFRESH_SKEW_MS): boolean {
  const exp = parseJwtExp(token);
  if (!exp) return true;
  return exp * 1000 <= Date.now() + skewMs;
}

async function doRefresh(): Promise<boolean> {
  const auth = await loadAuth();
  if (!auth?.refresh_token) return false;

  const res = await fetch(`${apiBase()}/api/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.refresh_token}` },
  });
  const text = await res.text();
  if (!res.ok) {
    await clearAuth();
    return false;
  }
  const data = JSON.parse(text) as Pick<StoredAuth, 'token' | 'refresh_token'>;
  await saveAuth({ ...auth, ...data });
  return true;
}

/** Refresh access token if missing or near expiry. Single-flight across callers. */
export async function ensureValidSession(): Promise<boolean> {
  const auth = await loadAuth();
  if (!auth?.token) return false;
  if (!accessTokenExpiresSoon(auth.token)) return true;
  if (!auth.refresh_token) {
    await clearAuth();
    return false;
  }

  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function startSessionWatcher() {
  const onVisible = () => {
    if (document.visibilityState === 'visible') void ensureValidSession();
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => document.removeEventListener('visibilitychange', onVisible);
}
