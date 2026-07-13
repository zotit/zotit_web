<script lang="ts">
  import { onMount } from 'svelte';
  import { listNotes, restoreNote, NOTES_PAGE_SIZE, type Note } from '../lib/api';
  import { nav } from '../lib/router';
  import SideDrawer from '../components/SideDrawer.svelte';
  import LinkifiedText from '../components/LinkifiedText.svelte';
  import PageShell from '../components/PageShell.svelte';
  import IconButton from '../components/IconButton.svelte';
  import ConfirmDialog from '../components/ConfirmDialog.svelte';
  import { RefreshCw } from '@lucide/svelte';

  let drawer = false;
  let busy = false;
  let error = '';
  let notes: Note[] = [];
  let page = 1;
  let hasMore = true;
  let restoreFor: Note | null = null;

  async function load(reset = false) {
    busy = true;
    error = '';
    try {
      if (reset) page = 1;
      const res = await listNotes({ page, is_deleted: true });
      if (!res.ok) throw new Error(res.error);
      notes = reset ? res.data : [...notes, ...res.data];
      hasMore = res.data.length >= NOTES_PAGE_SIZE;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  async function confirmRestore() {
    if (!restoreFor) return;
    const n = restoreFor;
    busy = true;
    error = '';
    const res = await restoreNote(n.id);
    busy = false;
    restoreFor = null;
    if (!res.ok) {
      error = res.error;
      return;
    }
    notes = notes.filter((x) => x.id !== n.id);
  }

  onMount(() => load(true));
</script>

<SideDrawer open={drawer} onClose={() => (drawer = false)} />

<PageShell
  title="Deleted notes"
  subtitle="Trashed notes are removed after 15 days"
  showMenu
  onMenu={() => (drawer = true)}
>
  <svelte:fragment slot="actions">
    <IconButton title="Refresh" ariaLabel="Refresh" variant="ghost" size="sm" disabled={busy} onClick={() => load(true)}>
      <RefreshCw size={17} />
    </IconButton>
  </svelte:fragment>

  {#if error}
    <div class="alert alert-error">
      <div class="alert-title">Error</div>
      <div class="muted">{error}</div>
    </div>
  {/if}

  {#if notes.length === 0 && !busy}
    <div class="emptyState">
      <p>Trash is empty</p>
    </div>
  {:else}
    <ul class="noteList">
      {#each notes as n (n.id)}
        <li class="noteItem">
          <div class="noteBody" style="max-height: none;">
            <LinkifiedText text={n.text} />
          </div>
          <div class="tagManageActions" style="margin-top: 8px;">
            <button type="button" class="btn primary" on:click={() => (restoreFor = n)} disabled={busy}>Restore</button>
          </div>
        </li>
      {/each}
    </ul>
    {#if hasMore}
      <div class="loadMoreRow">
        <button class="btn ghost" disabled={busy} on:click={() => (page += 1, load(false))}>Load more</button>
      </div>
    {/if}
  {/if}

  <button type="button" class="linkBtn authBackLink" style="margin-top: 12px;" on:click={() => nav('notes')}>
    Back to notes
  </button>
</PageShell>

<ConfirmDialog
  open={!!restoreFor}
  title="Restore note?"
  message="This note will return to your main list."
  confirmLabel="Restore"
  variant="primary"
  busy={busy}
  onConfirm={() => void confirmRestore()}
  onCancel={() => (restoreFor = null)}
/>
