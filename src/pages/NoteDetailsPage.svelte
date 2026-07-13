<script lang="ts">
  import { onMount } from 'svelte';
  import { listNotes, updateNote } from '../lib/api';
  import { nav } from '../lib/router';
  import PageShell from '../components/PageShell.svelte';
  import { ArrowLeft } from '@lucide/svelte';
  import IconButton from '../components/IconButton.svelte';

  export let id: string;

  let busy = false;
  let error = '';
  let text = '';

  async function load() {
    busy = true;
    error = '';
    try {
      const res = await listNotes({ page: 1 });
      if (!res.ok) throw new Error(res.error);
      const note = res.data.find((n) => n.id === id) ?? null;
      if (!note) throw new Error('Note not found. Open it from your notes list.');
      text = note.text;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  async function save() {
    if (busy) return;
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

<PageShell title="Edit note" subtitle="Update your note text">
  <svelte:fragment slot="actions">
    <IconButton title="Back" ariaLabel="Back to notes" variant="ghost" size="sm" onClick={() => nav('notes')}>
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
    <textarea class="textarea editorArea" bind:value={text} placeholder="Zot it…"></textarea>
    <button class="btn primary authSubmit" on:click={save} disabled={busy || !text.trim()}>
      {busy ? 'Saving…' : 'Save changes'}
    </button>
  </div>
</PageShell>
