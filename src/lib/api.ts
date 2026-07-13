import { apiBase } from '../env';
import { ensureValidSession } from './session';
import { clearAuth, loadAuth, saveAuth, type StoredAuth } from './storage';

export type LoginResponse = { token: string; refresh_token: string; is_active: boolean };
export type Tag = { id: string; name: string; color: number };
export type Note = {
  id: string;
  text: string;
  is_obscure: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: unknown;
  tag_id?: string | null;
  tag?: Tag | null;
};

/** Matches Go handler page size in handlers/notes.go */
export const NOTES_PAGE_SIZE = 20;

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

async function jsonFetch<T extends Json>(
  path: string,
  init: RequestInit & { retryOnAuth?: boolean } = {}
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const auth = await loadAuth();
  const needsAuth = init.retryOnAuth !== false && !!auth?.token;

  if (needsAuth) {
    const valid = await ensureValidSession();
    if (!valid) {
      return { ok: false, status: 401, error: 'Session expired. Please sign in again.' };
    }
  }

  const currentAuth = await loadAuth();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (currentAuth?.token) headers.set('Authorization', `Bearer ${currentAuth.token}`);

  const res = await fetch(`${apiBase()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  if (res.ok) {
    try {
      return { ok: true, data: (text ? (JSON.parse(text) as T) : (null as T)) };
    } catch {
      // Some endpoints return plain strings.
      return { ok: true, data: (text as unknown as T) };
    }
  }

  // If backend returns a string body like "invalid login" etc.
  const err = text.replaceAll('"', '') || res.statusText;

  // Attempt refresh on 401 once
  if (res.status === 401 && init.retryOnAuth !== false && currentAuth?.refresh_token) {
    const refreshed = await refresh(currentAuth.refresh_token);
    if (refreshed.ok) {
      return jsonFetch(path, { ...init, retryOnAuth: false });
    }
    await clearAuth();
  }

  return { ok: false, status: res.status, error: err };
}

export async function login(username: string, password: string) {
  const res = await jsonFetch<LoginResponse>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    retryOnAuth: false,
  });
  if (res.ok) {
    await saveAuth({ token: res.data.token, refresh_token: res.data.refresh_token, username });
  }
  return res;
}

export async function register(username: string, password: string, email_id: string) {
  return jsonFetch<string>('/api/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, email_id }),
    retryOnAuth: false,
  });
}

export async function forgotpw(username: string) {
  return jsonFetch<string>('/api/forgotpw', {
    method: 'POST',
    body: JSON.stringify({ username }),
    retryOnAuth: false,
  });
}

// Matches Go ActivateUserReq: old_password, new_password (and uses auth token)
export async function activate(old_password: string, new_password: string) {
  return jsonFetch<string>('/api/activate', {
    method: 'POST',
    body: JSON.stringify({ old_password, new_password }),
  });
}

export async function refresh(refreshToken: string) {
  // refresh uses JWT middleware in Go, expects Bearer refresh token.
  const res = await fetch(`${apiBase()}/api/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false as const, status: res.status, error: text.replaceAll('"', '') || res.statusText };
  }
  const data = JSON.parse(text) as Pick<LoginResponse, 'token' | 'refresh_token'>;
  const existing = (await loadAuth()) as StoredAuth | null;
  if (existing) await saveAuth({ ...existing, ...data });
  return { ok: true as const, data };
}

export async function me() {
  return jsonFetch<{ username: string; email_id: string; tokens: unknown[] }>('/api/me');
}

export async function updateProfile(body: { username?: string; email_id?: string }) {
  return jsonFetch<string>('/api/me', { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteProfile(body: { password: string; reason: string; reason_other: string }) {
  return jsonFetch<string>('/api/me', { method: 'DELETE', body: JSON.stringify(body) });
}

export async function listNotes(params: {
  page?: number;
  text?: string;
  tag_id?: string;
  is_deleted?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.text) qs.set('text', params.text);
  if (params.tag_id) qs.set('tag_id', params.tag_id);
  if (typeof params.is_deleted === 'boolean') qs.set('is_deleted', params.is_deleted ? 'true' : 'false');
  const q = qs.toString();
  return jsonFetch<Note[]>(`/api/notes${q ? `?${q}` : ''}`);
}

export async function createNote(body: { text: string; tag_id?: string; is_obscure?: boolean }) {
  return jsonFetch<Note>('/api/notes', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateNote(body: { id: string; text?: string; is_obscure?: 'true' | 'false' }) {
  return jsonFetch<Note>('/api/notes', { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteNote(id: string) {
  return jsonFetch<{ is_deleted: boolean }>('/api/notes', { method: 'DELETE', body: JSON.stringify({ id }) });
}

export async function restoreNote(id: string) {
  return jsonFetch<{ is_restored: boolean }>('/api/notes/restore', { method: 'PUT', body: JSON.stringify({ id }) });
}

export async function listTags() {
  return jsonFetch<Tag[]>('/api/tags');
}

export async function createTag(body: { name: string; color: number }) {
  return jsonFetch<Tag>('/api/tags', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateTag(body: { id: string; name?: string; color?: number }) {
  return jsonFetch<Tag>('/api/tags', { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteTag(id: string) {
  return jsonFetch<string>('/api/tags', { method: 'DELETE', body: JSON.stringify({ id }) });
}

export async function assignTag(noteId: string, tagId: string) {
  return jsonFetch<Note>('/api/notes/assign-tag', {
    method: 'PUT',
    body: JSON.stringify({ id: noteId, tag_id: tagId }),
  });
}

export async function removeTag(noteId: string) {
  return jsonFetch<Note>('/api/notes/remove-tag', { method: 'PUT', body: JSON.stringify({ id: noteId }) });
}

export async function shareNote(user_name: string, note_id: string) {
  return jsonFetch<string>('/api/share-note', {
    method: 'POST',
    body: JSON.stringify({ user_name, note_id }),
  });
}

