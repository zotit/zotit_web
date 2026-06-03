<script lang="ts">
  import { onMount } from 'svelte';
  import { deleteProfile, me, updateProfile } from '../lib/api';
  import { nav } from '../lib/router';
  import SideDrawer from '../components/SideDrawer.svelte';
  import { loadAuth, saveAuth } from '../lib/storage';

  let drawer = false;
  let busy = false;
  let error = '';
  let message = '';

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
    message = 'Updated Profile';
  }

  async function removeAccount() {
    const password = prompt('Enter your password to delete account') ?? '';
    if (!password.trim()) return;
    const reason = prompt('Reason (optional)') ?? '';
    const other = prompt('Other reason (optional)') ?? '';
    busy = true;
    error = '';
    message = '';
    const res = await deleteProfile({ password: password.trim(), reason, reason_other: other });
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    alert(typeof res.data === 'string' ? res.data : 'Account deletion in progress.');
    nav('login');
  }

  onMount(boot);
</script>

<SideDrawer open={drawer} onClose={() => (drawer = false)} />

<div class="col" style="gap: 10px;">
  <div class="row">
    <button class="btn" on:click={() => (drawer = true)}>☰</button>
    <div class="spacer"></div>
    <div style="font-weight: 700;">Update Profile</div>
    <div class="spacer"></div>
    <button class="btn" on:click={boot} disabled={busy}>Refresh</button>
  </div>

  {#if error}
    <div class="card" style="padding: 10px; border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.08);">
      <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
      <div class="muted" style="white-space: pre-wrap;">{error}</div>
    </div>
  {/if}

  {#if message}
    <div class="card" style="padding: 10px; border-color: rgba(52,211,153,0.30); background: rgba(52,211,153,0.10);">
      <div style="font-weight: 600; margin-bottom: 4px;">Success</div>
      <div class="muted" style="white-space: pre-wrap;">{message}</div>
    </div>
  {/if}

  <input class="input" placeholder="Username" bind:value={username} />
  <input class="input" placeholder="Email Id" bind:value={email} />
  <button class="btn primary" disabled={busy || !username.trim() || !validEmail(email)} on:click={save}>
    {busy ? 'Updating…' : 'Update Profile'}
  </button>

  <div style="height: 22px;"></div>
  <button class="btn danger" on:click={removeAccount} disabled={busy}>Delete Profile</button>
</div>

