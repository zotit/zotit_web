<script lang="ts">
  import { onMount } from 'svelte';
  import { createTag, listTags, updateTag, type Tag } from '../lib/api';
  import { nav } from '../lib/router';

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
    // Store as ARGB-like int: 0xffRRGGBB (matches Flutter usage)
    return parseInt(`ff${h}`, 16);
  }

  async function save() {
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

<div class="col" style="gap: 10px;">
  <div class="row">
    <button class="btn" on:click={() => nav('tags')}>Back</button>
    <div class="spacer"></div>
    <div class="muted">{id ? 'Edit tag' : 'New tag'}</div>
  </div>

  {#if error}
    <div class="card" style="padding: 10px; border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.08);">
      <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
      <div class="muted" style="white-space: pre-wrap;">{error}</div>
    </div>
  {/if}

  <input class="input" placeholder="Tag name" bind:value={name} />
  <div class="row">
    <input class="input" type="color" bind:value={color} style="width: 64px; padding: 4px;" />
    <div class="muted">Pick color</div>
  </div>
  <button class="btn primary" disabled={busy || !name.trim()} on:click={save}>
    {busy ? 'Saving…' : 'Save'}
  </button>
</div>

