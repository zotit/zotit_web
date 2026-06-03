import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const root = fileURLToPath(new URL('.', import.meta.url));
const reconcilerPatch = path.join(root, 'src/vendor/svelte-reconciler-patch.js');

/** Avoid Svelte's template.innerHTML in extension bundles (Firefox AMO lint). */
function svelteReconcilerPatch(): Plugin {
  return {
    name: 'svelte-reconciler-patch',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        source === './reconciler.js' &&
        importer?.includes(`${path.sep}svelte${path.sep}src${path.sep}internal${path.sep}client${path.sep}dom${path.sep}`)
      ) {
        return reconcilerPatch;
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // For extension popups, relative paths are simplest.
  const base = mode === 'extension' ? './' : env.VITE_BASE ?? '/';

  return {
    base,
    plugins: [mode === 'extension' ? svelteReconcilerPatch() : null, svelte()].filter(Boolean),
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
