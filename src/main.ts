import './styles.css';
import App from './App.svelte';

import { mount } from 'svelte';

// extension build = browser popup; web build = hosted site
document.documentElement.dataset.surface =
  import.meta.env.MODE === 'extension' ? 'extension' : 'web';

mount(App, {
  target: document.getElementById('app')!,
});

