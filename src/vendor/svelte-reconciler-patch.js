/**
 * Drop-in replacement for svelte's reconciler.js (extension builds only).
 * Uses DOMParser instead of template.innerHTML so Firefox AMO lint passes.
 * HTML here is always Svelte-compiler output, never user/API content.
 */

/** @type {import('trusted-types').TrustedTypePolicy | undefined} */
const policy =
  globalThis?.window?.trustedTypes &&
  globalThis.window.trustedTypes.createPolicy('svelte-trusted-html', {
    createHTML: (html) => html,
  });

/** @param {string} html */
export function create_trusted_html(html) {
  return /** @type {string} */ (policy?.createHTML(html) ?? html);
}

/** @param {string} html */
export function create_fragment_from_html(html) {
  const normalized = String(create_trusted_html(html.replaceAll('<!>', '<!---->')));
  const doc = new DOMParser().parseFromString(`<body>${normalized}</body>`, 'text/html');
  const frag = document.createDocumentFragment();
  while (doc.body.firstChild) {
    frag.appendChild(doc.body.firstChild);
  }
  return frag;
}
