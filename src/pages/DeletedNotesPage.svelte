<script lang="ts">
  import { onMount } from 'svelte';
  import { listNotes, restoreNote, type Note } from '../lib/api';
  import { nav } from '../lib/router';
  import SideDrawer from '../components/SideDrawer.svelte';

  let drawer = false;
  let busy = false;
  let error = '';
  let notes: Note[] = [];
  let page = 1;

  async function load(reset = false) {
    busy = true;
    error = '';
    try {
      if (reset) page = 1;
      const res = await listNotes({ page, is_deleted: true });
      if (!res.ok) throw new Error(res.error);
      notes = reset ? res.data : [...notes, ...res.data];
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  async function restore(n: Note) {
    if (!confirm('Restore this note?')) return;
    busy = true;
    error = '';
    try {
      const res = await restoreNote(n.id);
      if (!res.ok) throw new Error(res.error);
      notes = notes.filter((x) => x.id !== n.id);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  onMount(() => load(true));
</script>

<SideDrawer open={drawer} onClose={() => (drawer = false)} />

<div class="col" style="gap: 10px;">
  <div class="row">
    <button class="btn" on:click={() => (drawer = true)}>☰</button>
    <div class="spacer"></div>
    <div>
      <div style="font-weight: 700;">Deleted Notes</div>
      <div class="muted" style="font-size: 11px;">All trashed notes will be auto deleted in 15 days</div>
    </div>
    <div class="spacer"></div>
    <button class="btn" on:click={() => load(true)} disabled={busy}>Refresh</button>
  </div>

  {#if error}
    <div class="card" style="padding: 10px; border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.08);">
      <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
      <div class="muted" style="white-space: pre-wrap;">{error}</div>
    </div>
  {/if}

  {#if notes.length === 0}
    <div class="muted" style="padding: 10px; text-align:center;">No Deleted Notes Found</div>
  {:else}
    <div class="col" style="gap: 10px;">
      {#each notes as n (n.id)}
        <div class="card" style="padding: 10px;">
          <div class="row" style="align-items: flex-start;">
            <div style="white-space: pre-wrap; line-height: 1.35;">{n.text}</div>
            <div class="spacer"></div>
            <button class="btn" on:click={() => restore(n)} disabled={busy}>Restore</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="row" style="justify-content: center; margin-top: 10px;">
    <button class="btn" disabled={busy} on:click={() => (page += 1, load(false))}>Load more</button>
    <button class="btn ghost" on:click={() => nav('notes')}>Back to notes</button>
  </div>
</div>

