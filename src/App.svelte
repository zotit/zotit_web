<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { auth, syncAuth } from './lib/auth';
  import { route, nav, isOpenRoute } from './lib/router';
  import { initTheme, toggleTheme } from './lib/theme';

  import LoginPage from './pages/LoginPage.svelte';
  import RegisterPage from './pages/RegisterPage.svelte';
  import ForgotPwPage from './pages/ForgotPwPage.svelte';
  import ResetPwPage from './pages/ResetPwPage.svelte';
  import NotesPage from './pages/NotesPage.svelte';
  import NoteDetailsPage from './pages/NoteDetailsPage.svelte';
  import DeletedNotesPage from './pages/DeletedNotesPage.svelte';
  import TagsPage from './pages/TagsPage.svelte';
  import TagDetailsPage from './pages/TagDetailsPage.svelte';
  import UpdateProfilePage from './pages/UpdateProfilePage.svelte';

  async function boot() {
    await initTheme();
    await syncAuth();
  }

  const unsubRoute = route.subscribe(async (r) => {
    const isOpen =
      r.name === 'login' || r.name === 'register' || r.name === 'forgotpw' || r.name === 'resetpw';
    await syncAuth();
    let a: { ready: boolean; authed: boolean; username: string } | null = null;
    const unsubAuth = auth.subscribe((x) => (a = x));
    unsubAuth();
    if (!a!.authed && !isOpen) nav('login');
    if (a!.authed && isOpen) nav('notes');
  });

  const unsubAuth = auth.subscribe((a) => {
    // If auth changes while on an open route, bounce into notes.
    const r = $route;
    const isOpen =
      r.name === 'login' || r.name === 'register' || r.name === 'forgotpw' || r.name === 'resetpw';
    if (a.ready && a.authed && isOpen) nav('notes');
  });

  onDestroy(() => {
    unsubRoute();
    unsubAuth();
  });
  onMount(boot);
</script>

<div class="shell">
  <div class="card" style="padding: 14px;">
    {#if $isOpenRoute}
      <div class="row" style="margin-bottom: 8px;">
        <div class="topbarTitle">ZotIt</div>
        <div class="spacer"></div>
        <button class="btn ghost" on:click={toggleTheme} title="Toggle theme">Theme</button>
      </div>
    {/if}

    {#if $route.name === 'login'}
      <LoginPage />
    {:else if $route.name === 'register'}
      <RegisterPage />
    {:else if $route.name === 'forgotpw'}
      <ForgotPwPage />
    {:else if $route.name === 'resetpw'}
      <ResetPwPage />
    {:else if $route.name === 'notes'}
      <NotesPage />
    {:else if $route.name === 'noteDetails'}
      <NoteDetailsPage id={$route.id} />
    {:else if $route.name === 'deletedNotes'}
      <DeletedNotesPage />
    {:else if $route.name === 'tags'}
      <TagsPage />
    {:else if $route.name === 'tagDetails'}
      <TagDetailsPage id={$route.id || ''} />
    {:else if $route.name === 'updateProfile'}
      <UpdateProfilePage />
    {/if}
  </div>
</div>

