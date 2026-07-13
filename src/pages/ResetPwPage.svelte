<script lang="ts">
  import { activate } from '../lib/api';
  import { nav } from '../lib/router';
  import AuthLayout from '../components/AuthLayout.svelte';
  import FormField from '../components/FormField.svelte';

  let busy = false;
  let error = '';
  let message = '';
  let otp = '';
  let newPw = '';
  let confirmPw = '';

  async function submit() {
    if (busy) return;
    if (newPw.length < 6) {
      error = 'Password must be at least 6 characters';
      return;
    }
    if (newPw !== confirmPw) {
      error = 'Passwords do not match';
      return;
    }
    if (!otp.trim()) {
      error = 'One-time password from email is required';
      return;
    }
    busy = true;
    error = '';
    message = '';
    const res = await activate(otp.trim(), newPw);
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    message = typeof res.data === 'string' ? res.data : 'Password updated.';
    nav('login');
  }
</script>

<AuthLayout
  title="Set new password"
  subtitle="Paste the one-time password from your email, then choose a new password."
>
  {#if error}
    <div class="alert alert-error">
      <div class="alert-title">Could not reset</div>
      <div class="muted">{error}</div>
    </div>
  {/if}

  {#if message}
    <div class="alert alert-success">
      <div class="alert-title">Success</div>
      <div class="muted">{message}</div>
    </div>
  {/if}

  <FormField label="One-time password" bind:value={otp} placeholder="From your reset email" />
  <FormField label="New password" type="password" bind:value={newPw} placeholder="At least 6 characters" autocomplete="new-password" />
  <FormField label="Confirm password" type="password" bind:value={confirmPw} placeholder="Re-enter password" autocomplete="new-password" />

  <div class="authActions">
    <button
      class="btn primary authSubmit"
      disabled={busy || newPw.length < 6 || confirmPw.length < 6 || !otp.trim()}
      on:click={submit}
    >
      {busy ? 'Updating…' : 'Update password'}
    </button>
    <button type="button" class="linkBtn authBackLink" on:click={() => nav('login')}>Back to sign in</button>
  </div>
</AuthLayout>
