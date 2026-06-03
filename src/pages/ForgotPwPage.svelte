<script lang="ts">
  import { forgotpw } from '../lib/api';
  import { nav } from '../lib/router';

  let busy = false;
  let error = '';
  let message = '';
  let username = '';

  async function submit() {
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
    // In Flutter, this leads to a one-time password flow that ends in resetpw/activate.
    nav('resetpw');
  }
</script>

<div class="col" style="gap: 10px;">
  <div class="muted">Reset password</div>

  {#if error}
    <div class="card" style="padding: 10px; border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.08);">
      <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
      <div class="muted" style="white-space: pre-wrap;">{error}</div>
    </div>
  {/if}

  {#if message}
    <div class="card" style="padding: 10px; border-color: rgba(52,211,153,0.30); background: rgba(52,211,153,0.10);">
      <div style="font-weight: 600; margin-bottom: 4px;">Sent</div>
      <div class="muted" style="white-space: pre-wrap;">{message}</div>
    </div>
  {/if}

  <input class="input" placeholder="Username / EmailID" bind:value={username} on:keydown={(e)=>e.key==='Enter' && submit()} />
  <button class="btn primary" disabled={busy || !username.trim()} on:click={submit}>
    {busy ? 'Sending…' : 'Reset Password'}
  </button>
  <button class="btn" on:click={() => nav('login')}>Sign in</button>
</div>

