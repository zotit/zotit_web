<script lang="ts">
  import { forgotpw } from '../lib/api';
  import { nav } from '../lib/router';
  import AuthLayout from '../components/AuthLayout.svelte';
  import FormField from '../components/FormField.svelte';

  let busy = false;
  let error = '';
  let message = '';
  let username = '';

  async function submit() {
    if (busy) return;
    busy = true;
    error = '';
    message = '';
    const res = await forgotpw(username.trim());
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    message = typeof res.data === 'string' ? res.data : 'Check your email for reset instructions.';
    nav('resetpw');
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') void submit();
  }
</script>

<AuthLayout title="Reset password" subtitle="We'll send a one-time password to your registered email.">
  {#if error}
    <div class="alert alert-error">
      <div class="alert-title">Request failed</div>
      <div class="muted">{error}</div>
    </div>
  {/if}

  {#if message}
    <div class="alert alert-success">
      <div class="alert-title">Email sent</div>
      <div class="muted">{message}</div>
    </div>
  {/if}

  <FormField
    label="Username or email"
    bind:value={username}
    placeholder="Account username or email"
    on:keydown={onKeydown}
  />

  <div class="authActions">
    <button class="btn primary authSubmit" disabled={busy || !username.trim()} on:click={submit}>
      {busy ? 'Sending…' : 'Send reset email'}
    </button>
    <button type="button" class="linkBtn authBackLink" on:click={() => nav('login')}>Back to sign in</button>
  </div>
</AuthLayout>
