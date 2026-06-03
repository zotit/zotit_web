const DEFAULT_API_BASE = 'https://zotit.app';

export function apiBase(): string {
  // web builds can set VITE_API_BASE; extension builds can also set it at build-time.
  const fromVite = import.meta.env.VITE_API_BASE as string | undefined;
  return (fromVite && fromVite.trim().length > 0 ? fromVite : DEFAULT_API_BASE).replace(/\/+$/, '');
}

