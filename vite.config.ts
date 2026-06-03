import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // For extension popups, relative paths are simplest.
  const base = mode === 'extension' ? './' : env.VITE_BASE ?? '/';

  return {
    base,
    plugins: [svelte()],
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          main: new URL('./index.html', import.meta.url).pathname,
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});

