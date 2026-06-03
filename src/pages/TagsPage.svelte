<script lang="ts">
  import { onMount } from 'svelte';
  import { deleteTag, listTags, type Tag } from '../lib/api';
  import { nav } from '../lib/router';
  import SideDrawer from '../components/SideDrawer.svelte';

  let drawer = false;
  let busy = false;
  let error = '';
  let tags: Tag[] = [];

  async function load() {
    busy = true;
    error = '';
    const res = await listTags();
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    tags = res.data;
  }

  function tagBg(t: Tag) {
    const hex = t.color.toString(16).padStart(8, '0');
    return `#${hex.slice(2)}`;
  }

  async function remove(t: Tag) {
    if (!confirm(`Delete tag "${t.name}"?`)) return;
    busy = true;
    error = '';
    const res = await deleteTag(t.id);
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    await load();
  }

  onMount(load);
</script>

<SideDrawer open={drawer} onClose={() => (drawer = false)} />

<div class="col" style="gap: 10px;">
  <div class="row">
    <button class="btn" on:click={() => (drawer = true)}>☰</button>
    <div class="spacer"></div>
    <div style="font-weight: 700;">Tags</div>
    <div class="spacer"></div>
    <button class="btn" on:click={load} disabled={busy}>Refresh</button>
    <button class="btn primary" on:click={() => nav('tag')} disabled={busy}>+ Add</button>
  </div>

  {#if error}
    <div class="card" style="padding: 10px; border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.08);">
      <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
      <div class="muted" style="white-space: pre-wrap;">{error}</div>
    </div>
  {/if}

  {#if tags.length === 0}
    <div class="muted" style="padding: 10px; text-align:center;">No Tags Found</div>
  {:else}
    <div class="col" style="gap: 10px;">
      {#each tags as t (t.id)}
        <div class="card" style="padding: 10px;">
          <div class="row">
            <div style="width: 18px; height: 18px; border-radius: 999px; background: {tagBg(t)}; border: 1px solid var(--border);"></div>
            <div style="font-weight: 600;">{t.name}</div>
            <div class="spacer"></div>
            <button class="btn" on:click={() => nav(`tag?id=${encodeURIComponent(t.id)}`)}>Edit</button>
            <button class="btn danger" on:click={() => remove(t)} disabled={busy}>Delete</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

