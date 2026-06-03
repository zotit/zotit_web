import { derived, writable } from 'svelte/store';

export type Route =
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'forgotpw' }
  | { name: 'resetpw' }
  | { name: 'notes' }
  | { name: 'noteDetails'; id: string }
  | { name: 'deletedNotes' }
  | { name: 'tags' }
  | { name: 'tagDetails'; id?: string }
  | { name: 'updateProfile' };

function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?', 2);
  const parts = (path || 'notes').split('/').filter(Boolean);

  const q = new URLSearchParams(query ?? '');
  const id = q.get('id') ?? '';

  switch (parts[0]) {
    case 'login':
      return { name: 'login' };
    case 'register':
      return { name: 'register' };
    case 'forgotpw':
      return { name: 'forgotpw' };
    case 'resetpw':
      return { name: 'resetpw' };
    case 'deleted':
      return { name: 'deletedNotes' };
    case 'tags':
      return { name: 'tags' };
    case 'tag':
      return { name: 'tagDetails', id: id || parts[1] || '' };
    case 'profile':
      return { name: 'updateProfile' };
    case 'note':
      return { name: 'noteDetails', id: id || parts[1] || '' };
    case 'notes':
    default:
      return { name: 'notes' };
  }
}

export const route = writable<Route>(parseHash(window.location.hash));

window.addEventListener('hashchange', () => {
  route.set(parseHash(window.location.hash));
});

export function nav(to: string) {
  if (!to.startsWith('#')) window.location.hash = `#/${to.replace(/^\//, '')}`;
  else window.location.hash = to;
}

const OPEN_ROUTES = new Set<Route['name']>(['login', 'register', 'forgotpw', 'resetpw']);

export const isOpenRoute = derived(route, ($route) => OPEN_ROUTES.has($route.name));
export const isProtectedRoute = derived(route, ($route) => !OPEN_ROUTES.has($route.name));

