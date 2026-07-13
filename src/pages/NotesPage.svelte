<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    assignTag,
    createNote,
    deleteNote,
    listNotes,
    listTags,
    removeTag,
    shareNote,
    updateNote,
    NOTES_PAGE_SIZE,
    type Note,
    type Tag,
  } from '../lib/api';
  import { nav } from '../lib/router';
  import SideDrawer from '../components/SideDrawer.svelte';
  import { toggleTheme } from '../lib/theme';
  import IconButton from '../components/IconButton.svelte';
  import LinkifiedText from '../components/LinkifiedText.svelte';
  import ConfirmDialog from '../components/ConfirmDialog.svelte';
  import {
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
    ExternalLink,
    Plus,
    StickyNote,
  } from '@lucide/svelte';

  let drawer = false;
  let busy = false;
  let loadingMore = false;
  let hasMore = true;
  let error = '';
  let toast = '';

  let scrollEl: HTMLDivElement | undefined;

  let isSearching = false;
  let search = '';
  let selectedTagId = '';

  let tags: Tag[] = [];
  let notes: Note[] = [];
  let page = 1;

  let newText = '';
  let addingNote = false;
  let composerCompact = false;
  let composerFocused = false;

  let tagPickerFor: Note | null = null;
  let shareFor: Note | null = null;
  let deleteFor: Note | null = null;
  let shareUsername = '';

  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let refreshing = false;

  $: initialLoading = busy && notes.length === 0;
  $: searchBlocked = search.length > 0 && search.length < 3;

  function infiniteScroll(
    node: HTMLElement,
    params: { root: HTMLDivElement | undefined; enabled: boolean }
  ) {
    let observer: IntersectionObserver | undefined;

    function update(p: { root: HTMLDivElement | undefined; enabled: boolean }) {
      observer?.disconnect();
      observer = undefined;
      if (!p.enabled || !p.root) return;
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) void loadMore();
        },
        { root: p.root, rootMargin: '200px', threshold: 0 }
      );
      observer.observe(node);
    }

    update(params);
    return { update, destroy: () => observer?.disconnect() };
  }

  async function load(reset = false) {
    if (reset) {
      busy = true;
      refreshing = true;
      page = 1;
      hasMore = true;
    }
    error = '';
    try {
      if (reset) {
        const [tRes, nRes] = await Promise.all([
          listTags(),
          listNotes({ page, text: search, tag_id: selectedTagId || undefined }),
        ]);
        if (!tRes.ok) throw new Error(tRes.error);
        if (!nRes.ok) throw new Error(nRes.error);
        tags = tRes.data;
        notes = nRes.data;
        hasMore = nRes.data.length >= NOTES_PAGE_SIZE;
      } else {
        const nRes = await listNotes({ page, text: search, tag_id: selectedTagId || undefined });
        if (!nRes.ok) throw new Error(nRes.error);
        notes = [...notes, ...nRes.data];
        hasMore = nRes.data.length >= NOTES_PAGE_SIZE;
      }
    } catch (e) {
      if (!reset) page = Math.max(1, page - 1);
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
      refreshing = false;
      loadingMore = false;
    }
  }

  async function loadMore() {
    if (!hasMore || loadingMore || busy || searchBlocked) return;
    loadingMore = true;
    page += 1;
    await load(false);
  }

  function showToast(msg: string) {
    toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ''), 2200);
  }

  function scheduleSearch() {
    clearTimeout(searchTimer);
    if (search.length > 0 && search.length < 3) return;
    searchTimer = setTimeout(() => load(true), 300);
  }

  async function addNote() {
    const text = newText.trim();
    if (!text || addingNote) return;

    addingNote = true;
    busy = true;
    error = '';
    newText = '';

    try {
      const res = await createNote({ text, is_obscure: false, tag_id: '' });
      if (!res.ok) throw new Error(res.error);
      notes = [res.data, ...notes];
      showToast('Note added');
    } catch (e) {
      newText = text;
      error = e instanceof Error ? e.message : String(e);
    } finally {
      addingNote = false;
      busy = false;
    }
  }

  function onComposerKeydown(e: KeyboardEvent) {
    if (e.repeat) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void addNote();
    }
  }

  function onNotesScroll(e: Event) {
    const top = (e.currentTarget as HTMLDivElement).scrollTop;
    composerCompact = top > 48 && !composerFocused;
  }

  function onComposerFocus() {
    composerFocused = true;
    composerCompact = false;
  }

  function onComposerBlur() {
    composerFocused = false;
    if (scrollEl) composerCompact = scrollEl.scrollTop > 48;
  }

  async function toggleObscure(n: Note) {
    const next = !n.is_obscure;
    n.is_obscure = next;
    notes = [...notes];
    const res = await updateNote({ id: n.id, is_obscure: next ? 'true' : 'false' });
    if (!res.ok) error = res.error;
  }

  async function confirmDelete() {
    if (!deleteFor) return;
    const n = deleteFor;
    busy = true;
    error = '';
    const res = await deleteNote(n.id);
    busy = false;
    deleteFor = null;
    if (!res.ok) {
      error = res.error;
      return;
    }
    notes = notes.filter((x) => x.id !== n.id);
    showToast('Note deleted');
  }

  function deletePreview(text: string) {
    const oneLine = text.replace(/\s+/g, ' ').trim();
    if (oneLine.length <= 80) return oneLine;
    return `${oneLine.slice(0, 80)}…`;
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied');
    } catch {
      error = 'Could not copy to clipboard';
    }
  }

  function chipText(tag: Tag | null | undefined) {
    if (!tag?.name) return 'Tag';
    return tag.name;
  }

  function tagColor(tag: Tag | null | undefined) {
    const c = tag?.color ?? 0xff64748b;
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
      showToast(typeof res.data === 'string' ? res.data : 'Shared');
      shareFor = null;
      shareUsername = '';
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  function closeSearch() {
    isSearching = false;
    search = '';
    selectedTagId = '';
    load(true);
  }

  onMount(() => load(true));
  onDestroy(() => {
    clearTimeout(searchTimer);
    clearTimeout(toastTimer);
  });
</script>

<SideDrawer open={drawer} onClose={() => (drawer = false)} />

<div class="notesApp">
  <header class="notesHeader">
    <div class="notesHeaderMain">
      <button type="button" class="menuBtn" on:click={() => (drawer = true)} aria-label="Menu">
        <Menu size={20} />
      </button>
      <div class="notesBrand">
        <div class="topbarTitle">ZotIt</div>
        <div class="notesSubtitle">{notes.length} notes</div>
      </div>
    </div>
    <div class="notesToolbar">
      <IconButton title="Theme" ariaLabel="Theme" variant="ghost" size="sm" onClick={toggleTheme}>
        <Palette size={17} />
      </IconButton>
      <IconButton
        title={isSearching ? 'Close search' : 'Search'}
        ariaLabel="Search"
        variant={isSearching ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => (isSearching ? closeSearch() : (isSearching = true))}
      >
        {#if isSearching}
          <SearchX size={17} />
        {:else}
          <Search size={17} />
        {/if}
      </IconButton>
      <IconButton
        title="Refresh"
        ariaLabel="Refresh"
        variant="ghost"
        size="sm"
        disabled={busy}
        spin={refreshing}
        onClick={() => load(true)}
      >
        <RefreshCw size={17} />
      </IconButton>
    </div>
  </header>

  {#if isSearching}
    <section class="notesPanel searchPanel">
      <input
        class="input searchInput"
        placeholder="Search notes (min 3 letters)…"
        bind:value={search}
        on:input={scheduleSearch}
      />
      <div class="tagRow">
        <button
          type="button"
          class="tagPill"
          class:tagPillActive={selectedTagId === ''}
          on:click={() => (selectedTagId = '', load(true))}
        >
          All
        </button>
        {#each tags as t (t.id)}
          <button
            type="button"
            class="tagPill"
            class:tagPillActive={selectedTagId === t.id}
            style="--pill-color: {tagColor(t)}"
            on:click={() => (selectedTagId = t.id, load(true))}
            title={t.name}
          >
            {t.name}
          </button>
        {/each}
      </div>
    </section>
  {:else}
    <section class="notesPanel composerPanel" class:compact={composerCompact}>
      <textarea
        class="textarea composerInput"
        placeholder={composerCompact ? 'Zot it…' : "What's on your mind?"}
        rows={composerCompact ? 1 : 2}
        bind:value={newText}
        on:keydown={onComposerKeydown}
        on:focus={onComposerFocus}
        on:blur={onComposerBlur}
      ></textarea>
      <div class="composerBar">
        <span class="composerHint">⌘/Ctrl + Enter</span>
        <button
          class="btn primary composerAdd"
          on:click={addNote}
          disabled={addingNote || busy || !newText.trim()}
          title="Add note"
        >
          <Plus size={16} />
          <span class="composerAddLabel">Add</span>
        </button>
      </div>
    </section>
  {/if}

  <div class="notesScroll" bind:this={scrollEl} on:scroll={onNotesScroll}>
    {#if error}
      <div class="alert alert-error notesAlert">
        <div class="alert-title">Error</div>
        <div class="muted" style="white-space: pre-wrap;">{error}</div>
      </div>
    {/if}

    {#if initialLoading}
      <div class="listLoading">
        {#each Array(3) as _, i (i)}
          <div class="noteSkeleton"></div>
        {/each}
      </div>
    {:else if notes.length === 0}
      <div class="emptyState">
        <StickyNote size={36} strokeWidth={1.25} />
        <p>No notes yet</p>
        <span class="muted">Capture something with the box above</span>
      </div>
    {:else}
      <ul class="noteList">
        {#each notes as n (n.id)}
          <li class="noteItem" style="--accent: {tagColor(n.tag)}">
            <div class="noteItemTop">
              <button
                type="button"
                class="tagPill"
                style="--pill-color: {tagColor(n.tag)}"
                on:click={() => (tagPickerFor = n)}
                title="Change tag"
              >
                {chipText(n.tag)}
              </button>
              <div class="noteItemActions">
                <IconButton
                  title={n.is_obscure ? 'Show' : 'Hide'}
                  ariaLabel={n.is_obscure ? 'Show note' : 'Hide note'}
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleObscure(n)}
                >
                  {#if n.is_obscure}
                    <Eye size={16} />
                  {:else}
                    <EyeOff size={16} />
                  {/if}
                </IconButton>
                <IconButton
                  title="Open"
                  ariaLabel="Open note"
                  variant="ghost"
                  size="sm"
                  onClick={() => nav(`note?id=${encodeURIComponent(n.id)}`)}
                >
                  <ExternalLink size={16} />
                </IconButton>
                <IconButton
                  title={n.is_obscure ? 'Show to copy' : 'Copy'}
                  ariaLabel="Copy"
                  variant="ghost"
                  size="sm"
                  disabled={n.is_obscure}
                  onClick={() => copyText(n.text)}
                >
                  <Copy size={16} />
                </IconButton>
                <IconButton
                  title="Share"
                  ariaLabel="Share"
                  variant="ghost"
                  size="sm"
                  onClick={() => (shareFor = n)}
                >
                  <Share2 size={16} />
                </IconButton>
                <IconButton
                  title="Delete"
                  ariaLabel="Delete"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => (deleteFor = n)}
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </div>

            <div class="noteBody" class:obscure={n.is_obscure} aria-hidden={n.is_obscure}>
              {#if n.is_obscure}
                {n.text}
              {:else}
                <LinkifiedText text={n.text} />
              {/if}
            </div>
          </li>
        {/each}
      </ul>

      {#if hasMore}
        <div
          class="listFooter"
          use:infiniteScroll={{ root: scrollEl, enabled: hasMore && !loadingMore && !searchBlocked }}
        >
          {#if loadingMore}
            <span class="listFooterSpin"><RefreshCw size={16} /></span>
            <span>Loading more…</span>
          {:else}
            <span class="muted">Scroll for more</span>
          {/if}
        </div>
      {:else}
        <div class="listFooter listFooterEnd">
          <span class="muted">You're all caught up</span>
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if tagPickerFor}
  <button type="button" class="overlay" on:click={() => (tagPickerFor = null)} aria-label="Close"></button>
  <div class="card sheet">
    <div class="sheetTitle">Pick a tag</div>
    <div class="tagRow">
      <button type="button" class="tagPill" on:click={() => chooseTag('')}>
        Remove tag
      </button>
      {#each tags as t (t.id)}
        <button
          type="button"
          class="tagPill"
          class:tagPillActive={tagPickerFor?.tag?.id === t.id}
          style="--pill-color: {tagColor(t)}"
          on:click={() => chooseTag(t.id)}
          title={t.name}
        >
          {t.name}
        </button>
      {/each}
    </div>
  </div>
{/if}

{#if shareFor}
  <button type="button" class="overlay" on:click={() => (shareFor = null, shareUsername = '')} aria-label="Close"></button>
  <div class="card sheet">
    <div class="sheetTitle">Share note</div>
    <div class="col" style="gap: 10px;">
      <input class="input" placeholder="Receiver's ZotIt username" bind:value={shareUsername} />
      <div class="row">
        <button class="btn primary" on:click={doShare} disabled={busy || !shareUsername.trim()}>Share</button>
        <div class="spacer"></div>
        <button class="btn ghost" on:click={() => (shareFor = null, shareUsername = '')}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

{#if toast}
  <div class="toast" role="status">{toast}</div>
{/if}

<ConfirmDialog
  open={!!deleteFor}
  title="Delete note?"
  message={deleteFor ? `This note will be moved to trash.\n\n“${deletePreview(deleteFor.text)}”` : ''}
  confirmLabel="Delete"
  cancelLabel="Cancel"
  variant="danger"
  busy={busy}
  onConfirm={() => void confirmDelete()}
  onCancel={() => (deleteFor = null)}
/>
