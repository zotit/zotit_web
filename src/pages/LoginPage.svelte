<script lang="ts">
  import { login } from '../lib/api';
  import { nav } from '../lib/router';
  import AuthLayout from '../components/AuthLayout.svelte';
  import FormField from '../components/FormField.svelte';

  let busy = false;
  let error = '';
  let username = '';
  let password = '';

  async function submit() {
    if (busy) return;
    busy = true;
    error = '';
    const res = await login(username.trim(), password);
    busy = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    nav('notes');
  }

  function onPasswordKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') void submit();
  }
</script>

<AuthLayout title="Welcome back" subtitle="Sign in to access your notes anywhere.">
  {#if error}
    <div class="alert alert-error">
      <div class="alert-title">Could not sign in</div>
      <div class="muted">{error}</div>
    </div>
  {/if}

  <FormField label="Username" bind:value={username} placeholder="Your username" autocomplete="username" />
  <FormField
    label="Password"
    type="password"
    bind:value={password}
    placeholder="Your password"
    autocomplete="current-password"
    on:keydown={onPasswordKeydown}
  />

  <div class="authActions">
    <button class="btn primary authSubmit" disabled={busy || !username || !password} on:click={submit}>
      {busy ? 'Signing in…' : 'Sign in'}
    </button>
    <div class="authLinks">
      <button type="button" class="linkBtn" on:click={() => nav('register')}>Create account</button>
      <button type="button" class="linkBtn" on:click={() => nav('forgotpw')}>Forgot password?</button>
    </div>
  </div>
</AuthLayout>
