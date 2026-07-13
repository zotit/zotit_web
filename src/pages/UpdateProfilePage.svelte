<script lang="ts">
  import { onMount } from 'svelte';
  import { deleteProfile, me, updateProfile } from '../lib/api';
  import { nav } from '../lib/router';
  import SideDrawer from '../components/SideDrawer.svelte';
  import PageShell from '../components/PageShell.svelte';
  import FormField from '../components/FormField.svelte';
  import { loadAuth, saveAuth } from '../lib/storage';

  let drawer = false;
  let busy = false;
  let error = '';
  let message = '';
  let showDeleteConfirm = false;
  let deletePassword = '';

  let username = '';
  let email = '';

  async function boot() {
    busy = true;
    error = '';
    message = '';
    try {
      const auth = await loadAuth();
      username = auth?.username ?? '';
      const res = await me();
      if (!res.ok) throw new Error(res.error);
      email = res.data.email_id ?? '';
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }

  function validEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function save() {
    if (busy) return;
    busy = true;
    error = '';
    message = '';
    const res = await updateProfile({ username: username.trim(), email_id: email.trim() });
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    const auth = await loadAuth();
    if (auth) await saveAuth({ ...auth, username: username.trim() });
    message = 'Profile updated';
  }

  async function confirmDeleteAccount() {
    if (!deletePassword.trim()) {
      error = 'Password is required';
      return;
    }
    busy = true;
    error = '';
    message = '';
    const res = await deleteProfile({
      password: deletePassword.trim(),
      reason: '',
      reason_other: '',
    });
    busy = false;
    showDeleteConfirm = false;
    deletePassword = '';
    if (!res.ok) {
      error = res.error;
      return;
    }
    nav('login');
  }

  onMount(boot);
</script>

<SideDrawer open={drawer} onClose={() => (drawer = false)} />

<PageShell title="Profile" subtitle="Update your account details" showMenu onMenu={() => (drawer = true)}>
  {#if error}
    <div class="alert alert-error">
      <div class="alert-title">Error</div>
      <div class="muted">{error}</div>
    </div>
  {/if}

  {#if message}
    <div class="alert alert-success">
      <div class="alert-title">Saved</div>
      <div class="muted">{message}</div>
    </div>
  {/if}

  <div class="notesPanel formPanel">
    <FormField label="Username" bind:value={username} placeholder="Username" autocomplete="username" />
    <FormField label="Email" type="email" bind:value={email} placeholder="Email address" autocomplete="email" />
    <button class="btn primary authSubmit" disabled={busy || !username.trim() || !validEmail(email)} on:click={save}>
      {busy ? 'Saving…' : 'Save profile'}
    </button>
  </div>

  <div class="dangerZone">
    <p class="dangerZoneTitle">Danger zone</p>
    <p class="muted dangerZoneText">Permanently delete your account and all notes.</p>
    <button class="btn danger" on:click={() => (showDeleteConfirm = true)} disabled={busy}>
      Delete account
    </button>
  </div>
</PageShell>

{#if showDeleteConfirm}
  <button type="button" class="overlay" on:click={() => (showDeleteConfirm = false)} aria-label="Close"></button>
  <div class="confirmDialog card" role="alertdialog">
    <div class="confirmTitle">Delete account?</div>
    <p class="confirmMessage">This cannot be undone. Enter your password to confirm.</p>
    <FormField label="Password" type="password" bind:value={deletePassword} placeholder="Your password" />
    <div class="confirmActions">
      <button type="button" class="btn ghost" on:click={() => (showDeleteConfirm = false)} disabled={busy}>Cancel</button>
      <button type="button" class="btn danger" on:click={() => void confirmDeleteAccount()} disabled={busy || !deletePassword.trim()}>
        {busy ? 'Deleting…' : 'Delete account'}
      </button>
    </div>
  </div>
{/if}
