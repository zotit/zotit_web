<script lang="ts">
  import { onMount } from 'svelte';
  import { deleteTag, listTags, type Tag } from '../lib/api';
  import { nav } from '../lib/router';
  import SideDrawer from '../components/SideDrawer.svelte';
  import PageShell from '../components/PageShell.svelte';
  import IconButton from '../components/IconButton.svelte';
  import ConfirmDialog from '../components/ConfirmDialog.svelte';
  import { Plus, RefreshCw } from '@lucide/svelte';

  let drawer = false;
  let busy = false;
  let error = '';
  let tags: Tag[] = [];
  let deleteFor: Tag | null = null;

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

  function tagColor(t: Tag) {
    const hex = t.color.toString(16).padStart(8, '0');
    return `#${hex.slice(2)}`;
  }

  async function confirmDelete() {
    if (!deleteFor) return;
    const t = deleteFor;
    busy = true;
    error = '';
    const res = await deleteTag(t.id);
    busy = false;
    deleteFor = null;
    if (!res.ok) {
      error = res.error;
      return;
    }
    await load();
  }

  onMount(load);
</script>

<SideDrawer open={drawer} onClose={() => (drawer = false)} />

<PageShell title="Tags" subtitle="Organize notes with colored labels" showMenu onMenu={() => (drawer = true)}>
  <svelte:fragment slot="actions">
    <IconButton title="Refresh" ariaLabel="Refresh" variant="ghost" size="sm" disabled={busy} onClick={load}>
      <RefreshCw size={17} />
    </IconButton>
    <IconButton title="Add tag" ariaLabel="Add tag" variant="primary" size="sm" disabled={busy} onClick={() => nav('tag')}>
      <Plus size={17} />
    </IconButton>
  </svelte:fragment>

  {#if error}
    <div class="alert alert-error">
      <div class="alert-title">Error</div>
      <div class="muted">{error}</div>
    </div>
  {/if}

  {#if tags.length === 0}
    <div class="emptyState">
      <p>No tags yet</p>
      <span class="muted">Create one to label your notes</span>
    </div>
  {:else}
    <ul class="tagManageList">
      {#each tags as t (t.id)}
        <li class="tagManageItem">
          <button type="button" class="tagPill" style="--pill-color: {tagColor(t)}" on:click={() => nav(`tag?id=${encodeURIComponent(t.id)}`)}>
            {t.name}
          </button>
          <div class="tagManageActions">
            <button type="button" class="btn ghost" on:click={() => nav(`tag?id=${encodeURIComponent(t.id)}`)}>Edit</button>
            <button type="button" class="btn danger" on:click={() => (deleteFor = t)} disabled={busy}>Delete</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</PageShell>

<ConfirmDialog
  open={!!deleteFor}
  title="Delete tag?"
  message={deleteFor ? `Remove “${deleteFor.name}” from your account.` : ''}
  confirmLabel="Delete"
  variant="danger"
  busy={busy}
  onConfirm={() => void confirmDelete()}
  onCancel={() => (deleteFor = null)}
/>
