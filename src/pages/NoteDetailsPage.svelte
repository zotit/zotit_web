<script lang="ts">
  import { onMount } from 'svelte';
  import { listNotes, updateNote, type Note } from '../lib/api';
  import { nav } from '../lib/router';

  export let id: string;

  let busy = false;
  let error = '';
  let note: Note | null = null;
  let text = '';

  async function load() {
    busy = true;
    error = '';
    try {
      // Backend doesn’t have a GET /notes/:id, so we fetch page 1 and match.
      const res = await listNotes({ page: 1 });
      if (!res.ok) throw new Error(res.error);
      note = res.data.find((n) => n.id === id) ?? null;
      if (!note) throw new Error('Note not found in page 1. Open it from Notes list.');
      text = note.text;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  async function save() {
    busy = true;
    error = '';
    try {
      const res = await updateNote({ id, text });
      if (!res.ok) throw new Error(res.error);
      nav('notes');
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  onMount(load);
</script>

<div class="col" style="gap: 10px;">
  <div class="row">
    <button class="btn" on:click={() => nav('notes')}>Back</button>
    <div class="spacer"></div>
    <div class="muted">Note details</div>
  </div>

  {#if error}
    <div class="card" style="padding: 10px; border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.08);">
      <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
      <div class="muted" style="white-space: pre-wrap;">{error}</div>
    </div>
  {/if}

  <textarea class="textarea" style="min-height: 220px;" bind:value={text} placeholder="Zot it ..."></textarea>
  <button class="btn primary" on:click={save} disabled={busy || !text.trim()}>
    {busy ? 'Updating…' : 'Update Text'}
  </button>
</div>

