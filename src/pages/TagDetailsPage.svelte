<script lang="ts">
  import { onMount } from 'svelte';
  import { createTag, listTags, updateTag } from '../lib/api';
  import { nav } from '../lib/router';
  import PageShell from '../components/PageShell.svelte';
  import FormField from '../components/FormField.svelte';
  import IconButton from '../components/IconButton.svelte';
  import { ArrowLeft } from '@lucide/svelte';

  export let id: string;

  let busy = false;
  let error = '';
  let name = '';
  let color = '#9e9e9e';

  async function boot() {
    if (!id) return;
    busy = true;
    error = '';
    const res = await listTags();
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    const found = res.data.find((t) => t.id === id);
    if (!found) {
      error = 'Tag not found';
      return;
    }
    name = found.name;
    const hex = found.color.toString(16).padStart(8, '0');
    color = `#${hex.slice(2)}`;
  }

  function toUintFromHex(hex: string): number {
    const h = hex.replace('#', '').padStart(6, '0');
    return parseInt(`ff${h}`, 16);
  }

  async function save() {
    if (busy) return;
    busy = true;
    error = '';
    const payload = { name: name.trim(), color: toUintFromHex(color) };
    const res = id ? await updateTag({ id, ...payload }) : await createTag(payload);
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    nav('tags');
  }

  onMount(boot);
</script>

<PageShell title={id ? 'Edit tag' : 'New tag'} subtitle="Name and color for your label">
  <svelte:fragment slot="actions">
    <IconButton title="Back" ariaLabel="Back to tags" variant="ghost" size="sm" onClick={() => nav('tags')}>
      <ArrowLeft size={18} />
    </IconButton>
  </svelte:fragment>

  {#if error}
    <div class="alert alert-error">
      <div class="alert-title">Error</div>
      <div class="muted">{error}</div>
    </div>
  {/if}

  <div class="notesPanel formPanel">
    <FormField label="Tag name" bind:value={name} placeholder="e.g. Work" />
    <label class="field">
      <span class="fieldLabel">Color</span>
      <div class="colorPickerRow">
        <input class="colorInput" type="color" bind:value={color} />
        <span class="tagPill previewPill" style="--pill-color: {color}">{name.trim() || 'Preview'}</span>
      </div>
    </label>
    <button class="btn primary authSubmit" disabled={busy || !name.trim()} on:click={save}>
      {busy ? 'Saving…' : 'Save tag'}
    </button>
  </div>
</PageShell>
