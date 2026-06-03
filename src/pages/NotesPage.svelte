<script lang="ts">
  import { onMount } from 'svelte';
  import {
    assignTag,
    createNote,
    deleteNote,
    listNotes,
    listTags,
    removeTag,
    shareNote,
    updateNote,
    type Note,
    type Tag,
  } from '../lib/api';
  import { nav } from '../lib/router';
  import SideDrawer from '../components/SideDrawer.svelte';
  import { toggleTheme } from '../lib/theme';
  import IconButton from '../components/IconButton.svelte';
  import {
    LayoutGrid,
    List,
    Search,
    SearchX,
    RefreshCw,
    Menu,
    Palette,
    Copy,
    Share2,
    Eye,
    EyeOff,
    Trash2,
  } from '@lucide/svelte';

  let drawer = false;
  let busy = false;
  let error = '';

  let isSearching = false;
  let isGrid = false;
  let search = '';
  let selectedTagId = '';

  let tags: Tag[] = [];
  let notes: Note[] = [];
  let page = 1;

  let newText = '';

  // simple “bottomsheet” modals
  let tagPickerFor: Note | null = null;
  let shareFor: Note | null = null;
  let shareUsername = '';

  async function load(reset = false) {
    busy = true;
    error = '';
    try {
      if (reset) page = 1;
      const [tRes, nRes] = await Promise.all([
        listTags(),
        listNotes({ page, text: search, tag_id: selectedTagId || undefined }),
      ]);
      if (!tRes.ok) throw new Error(tRes.error);
      if (!nRes.ok) throw new Error(nRes.error);
      tags = tRes.data;
      notes = reset ? nRes.data : [...notes, ...nRes.data];
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  async function addNote() {
    const text = newText.trim();
    if (!text) return;
    busy = true;
    error = '';
    try {
      const res = await createNote({ text, is_obscure: false, tag_id: '' });
      if (!res.ok) throw new Error(res.error);
      notes = [res.data, ...notes];
      newText = '';
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  async function toggleObscure(n: Note) {
    const next = !n.is_obscure;
    n.is_obscure = next;
    notes = [...notes];
    const res = await updateNote({ id: n.id, is_obscure: next ? 'true' : 'false' });
    if (!res.ok) error = res.error;
  }

  async function del(n: Note) {
    if (!confirm('Delete this note?')) return;
    busy = true;
    error = '';
    const res = await deleteNote(n.id);
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    notes = notes.filter((x) => x.id !== n.id);
  }

  function chipText(tag: Tag | null | undefined) {
    if (!tag?.name) return '+ Tag';
    return tag.name;
  }

  function tagBg(tag: Tag | null | undefined) {
    const c = tag?.color ?? 0xff9e9e9e;
    // Go stores uint; Flutter used ARGB int. We’ll just treat as hex RGB-ish.
    const hex = c.toString(16).padStart(8, '0');
    return `#${hex.slice(2)}`;
  }

  async function chooseTag(tagId: string) {
    if (!tagPickerFor) return;
    busy = true;
    error = '';
    try {
      const res = tagId ? await assignTag(tagPickerFor.id, tagId) : await removeTag(tagPickerFor.id);
      if (!res.ok) throw new Error(res.error);
      notes = notes.map((n) => (n.id === tagPickerFor!.id ? res.data : n));
      tagPickerFor = null;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  async function doShare() {
    if (!shareFor) return;
    busy = true;
    error = '';
    try {
      const res = await shareNote(shareUsername.trim(), shareFor.id);
      if (!res.ok) throw new Error(res.error);
      alert(typeof res.data === 'string' ? res.data : 'Shared');
      shareFor = null;
      shareUsername = '';
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  onMount(() => load(true));
</script>

<style>
  /* Full-width Notes page on web, without changing other pages */
  :global(.shell) {
    width: 100%;
    max-width: 100%;
  }

  :global(.shell > .card) {
    width: 100%;
  }

  /* Make only the content area scroll, keep topbar sticky */
  :global(body) {
    overflow: hidden;
  }

  .page {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 28px);
    min-height: 520px;
  }

  .stickyTop {
    position: sticky;
    top: 0;
    z-index: 20;
    padding-bottom: 10px;
    background: color-mix(in srgb, var(--panel) 78%, transparent);
    backdrop-filter: blur(10px);
  }

  .scrollArea {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    padding-right: 2px;
  }

  .notesGrid {
    display: grid;
    gap: 10px;
    grid-template-columns: 1fr;
  }

  @media (min-width: 720px) {
    .notesGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1100px) {
    .notesGrid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (min-width: 1400px) {
    .notesGrid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .notesGrid.list {
    grid-template-columns: 1fr;
  }

  /* Prevent card internals from forcing horizontal overflow */
  .noteHeaderRow,
  .noteActionsRow {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .noteHeaderRow > *,
  .noteActionsRow > * {
    min-width: 0;
  }

  .noteChip {
    max-width: 100%;
    flex: 0 1 auto;
  }

  .noteActionsRow .btn {
    flex: 0 0 auto;
  }

  .noteToggle {
    margin-left: auto;
  }

  .noteActionsRow .spacer {
    flex: 1 1 auto;
    min-width: 0;
  }

  /* Extra safety: never allow the card to exceed viewport width */
  .noteCard {
    max-width: 100%;
    overflow: hidden;
  }
</style>

<SideDrawer open={drawer} onClose={() => (drawer = false)} />

<div class="page">
  <div class="stickyTop">
    <div class="topbar">
      <div class="topbarTitle" style="margin-right: 6px;">ZotIt</div>
      <IconButton title="Menu" ariaLabel="Menu" onClick={() => (drawer = true)}>
        <Menu size={18} />
      </IconButton>
      <div class="spacer"></div>
      <div class="topbarGroup">
        <IconButton title="Theme" ariaLabel="Theme" variant="ghost" onClick={toggleTheme}>
          <Palette size={18} />
        </IconButton>

        <IconButton
          title={isGrid ? 'List view' : 'Grid view'}
          ariaLabel="Toggle view"
          onClick={() => (isGrid = !isGrid)}
        >
          {#if isGrid}
            <List size={18} />
          {:else}
            <LayoutGrid size={18} />
          {/if}
        </IconButton>

        <IconButton
          title={isSearching ? 'Stop search' : 'Search'}
          ariaLabel="Search"
          onClick={() =>
            (isSearching = !isSearching, !isSearching && (search = '', selectedTagId = '', load(true)))}
        >
          {#if isSearching}
            <SearchX size={18} />
          {:else}
            <Search size={18} />
          {/if}
        </IconButton>

        <IconButton title="Refresh" ariaLabel="Refresh" disabled={busy} onClick={() => load(true)}>
          <RefreshCw size={18} />
        </IconButton>
      </div>
    </div>
  </div>

  <div class="scrollArea">
    <div class="col" style="gap: 10px;">
      {#if error}
        <div
          class="card"
          style="padding: 10px; border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.08);"
        >
          <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
          <div class="muted" style="white-space: pre-wrap;">{error}</div>
        </div>
      {/if}

      {#if isSearching}
        <div class="card" style="padding: 10px;">
          <div class="col" style="gap: 10px;">
            <input
              class="input"
              placeholder="Search here… (min 3 letters)"
              bind:value={search}
              on:input={() => (search.length === 0 ? load(true) : search.length >= 3 && load(true))}
            />
            <div class="row" style="flex-wrap: wrap;">
              <button
                type="button"
                class="chip"
                on:click={() => (selectedTagId = '', load(true))}
                style="opacity: {selectedTagId === '' ? 1 : 0.7}; background: transparent;"
              >
                <span class="chipLabel">All tags</span>
              </button>
              {#each tags as t (t.id)}
                <button
                  type="button"
                  class="chip"
                  on:click={() => (selectedTagId = t.id, load(true))}
                  style="background: {tagBg(t)}; color: white; border-color: rgba(255,255,255,0.20); opacity: {selectedTagId===t.id ? 1 : 0.7};"
                  title={t.name}
                >
                  <span class="chipLabel">{t.name}</span>
                </button>
              {/each}
            </div>
          </div>
        </div>
      {:else}
        <div class="card" style="padding: 10px;">
          <textarea class="textarea" placeholder="Zot it …" bind:value={newText}></textarea>
          <div class="row" style="margin-top: 10px;">
            <button class="btn primary" on:click={addNote} disabled={busy || !newText.trim()} title="Add note">
              Done
            </button>
            <div class="spacer"></div>
            <div class="muted" style="font-size: 12px;">{notes.length} notes</div>
          </div>
        </div>
      {/if}

      {#if notes.length === 0}
        <div class="muted" style="padding: 10px; text-align: center;">No Notes Found</div>
      {:else}
        <div class="notesGrid" class:list={!isGrid}>
          {#each notes as n (n.id)}
            <div class="card noteCard" style="padding: 10px; border-radius: var(--radius-sm);">
              <div class="noteHeaderRow">
                <button
                  type="button"
                  class="chip noteChip"
                  style="background: {tagBg(n.tag)}; color: white; border-color: rgba(255,255,255,0.20);"
                  on:click={() => (tagPickerFor = n)}
                  title="Change tag"
                >
                  <span class="chipLabel">{chipText(n.tag)}</span>
                </button>
                <button class="btn noteToggle" on:click={() => toggleObscure(n)} title="Show/Hide">
                  {#if n.is_obscure}
                    <Eye size={16} style="margin-right:6px;" /> <span class="hideOnXs">Show</span>
                  {:else}
                    <EyeOff size={16} style="margin-right:6px;" /> <span class="hideOnXs">Hide</span>
                  {/if}
                </button>
              </div>

              <button
                type="button"
                style="
                  margin-top: 10px;
                  white-space: pre-wrap;
                  line-height: 1.35;
                  filter: {n.is_obscure ? 'blur(4px)' : 'none'};
                  cursor: pointer;
                  max-height: {isGrid ? '120px' : 'none'};
                  overflow: hidden;
                  border: 0;
                  padding: 0;
                  text-align: left;
                  width: 100%;
                  background: transparent;
                  color: inherit;
                "
                on:click={() => nav(`note?id=${encodeURIComponent(n.id)}`)}
                title="Open note details"
              >
                {n.text}
              </button>

              <div class="noteActionsRow" style="margin-top: 10px;">
                <button class="btn" on:click={() => navigator.clipboard.writeText(n.text)} title="Copy">
                  <Copy size={16} style="margin-right:6px;" /> <span class="hideOnXs">Copy</span>
                </button>
                <button class="btn" on:click={() => (shareFor = n)} title="Share">
                  <Share2 size={16} style="margin-right:6px;" /> <span class="hideOnXs">Share</span>
                </button>
                <div class="spacer"></div>
                <button class="btn danger" on:click={() => del(n)} disabled={busy} title="Delete">
                  <Trash2 size={16} style="margin-right:6px;" /> <span class="hideOnXs">Delete</span>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <div class="row" style="justify-content: center; margin-top: 10px;">
        <button
          class="btn"
          disabled={busy || (search.length > 0 && search.length < 3)}
          on:click={() => (page += 1, load(false))}
        >
          Load more
        </button>
      </div>
    </div>
  </div>
</div>

{#if tagPickerFor}
  <button type="button" style="position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 80; border: 0; padding: 0;" on:click={() => (tagPickerFor = null)} aria-label="Close"></button>
  <div class="card" style="position: fixed; left: 10px; right: 10px; bottom: 10px; z-index: 90; padding: 12px;">
    <div style="font-weight: 700; margin-bottom: 8px;">Pick a tag</div>
    <div class="row" style="flex-wrap: wrap;">
      <button type="button" class="chip" on:click={() => chooseTag('')} style="background: transparent;">
        <span class="chipLabel">Remove tag</span>
      </button>
      {#each tags as t (t.id)}
        <button
          type="button"
          class="chip"
          style="background: {tagBg(t)}; color: white; border-color: rgba(255,255,255,0.20);"
          on:click={() => chooseTag(t.id)}
          title={t.name}
        >
          <span class="chipLabel">{t.name}</span>
        </button>
      {/each}
    </div>
  </div>
{/if}

{#if shareFor}
  <button type="button" style="position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 80; border: 0; padding: 0;" on:click={() => (shareFor = null)} aria-label="Close"></button>
  <div class="card" style="position: fixed; left: 10px; right: 10px; bottom: 10px; z-index: 90; padding: 12px;">
    <div style="font-weight: 700; margin-bottom: 8px;">Share note</div>
    <div class="col" style="gap: 10px;">
      <input class="input" placeholder="Enter zotit username of receiver" bind:value={shareUsername} />
      <div class="row">
        <button class="btn primary" on:click={doShare} disabled={busy || !shareUsername.trim()}>Done</button>
        <div class="spacer"></div>
        <button class="btn" on:click={() => (shareFor = null, shareUsername = '')}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

