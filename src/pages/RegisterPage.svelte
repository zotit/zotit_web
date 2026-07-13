<script lang="ts">
  import { register } from '../lib/api';
  import { nav } from '../lib/router';
  import AuthLayout from '../components/AuthLayout.svelte';
  import FormField from '../components/FormField.svelte';

  let busy = false;
  let error = '';
  let username = '';
  let email = '';
  let password = '';
  let accept = false;

  function validEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function submit() {
    if (busy) return;
    if (!accept) {
      error = 'Please accept the Privacy Policy';
      return;
    }
    busy = true;
    error = '';
    const res = await register(username.trim(), password, email.trim());
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    nav('login');
  }
</script>

<AuthLayout title="Create account" subtitle="Start saving notes with ZotIt in seconds.">
  {#if error}
    <div class="alert alert-error">
      <div class="alert-title">Registration failed</div>
      <div class="muted">{error}</div>
    </div>
  {/if}

  <FormField label="Username" bind:value={username} placeholder="Choose a username" autocomplete="username" />
  <FormField label="Email" type="email" bind:value={email} placeholder="you@example.com" autocomplete="email" />
  <FormField
    label="Password"
    type="password"
    bind:value={password}
    placeholder="At least 6 characters"
    autocomplete="new-password"
  />

  <label class="checkboxField">
    <input type="checkbox" bind:checked={accept} />
    <span>
      I accept the
      <a href="https://zotit.app/privacy-policy-mapp.html" target="_blank" rel="noreferrer">Privacy Policy</a>
    </span>
  </label>

  <div class="authActions">
    <button
      class="btn primary authSubmit"
      disabled={busy || !username.trim() || !validEmail(email) || password.length < 6}
      on:click={submit}
    >
      {busy ? 'Creating account…' : 'Create account'}
    </button>
    <button type="button" class="linkBtn authBackLink" on:click={() => nav('login')}>Back to sign in</button>
  </div>
</AuthLayout>
