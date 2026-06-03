<script lang="ts">
  import { activate } from '../lib/api';
  import { nav } from '../lib/router';

  let busy = false;
  let error = '';
  let message = '';
  let newPw = '';
  let confirmPw = '';

  async function submit() {
    if (newPw.length < 6) {
      error = 'Password must be at least 6 characters';
      return;
    }
    if (newPw !== confirmPw) {
      error = 'Confirm password did not match';
      return;
    }
    busy = true;
    error = '';
    message = '';
    // Flutter sends old_password as the one-time password stored in prefs.
    // Here we ask user to paste the one-time password as "old password".
    const otp = prompt('Paste the one-time password from the email (temporary password)') ?? '';
    if (!otp.trim()) {
      busy = false;
      error = 'One-time password is required';
      return;
    }
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

<div class="col" style="gap: 10px;">
  <div class="muted">
    If you received a one-time password from the reset email, you can set a new password now.
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

  <input class="input" placeholder="New password" type="password" bind:value={newPw} />
  <input class="input" placeholder="Re-enter password" type="password" bind:value={confirmPw} />
  <button class="btn primary" disabled={busy || newPw.length < 6 || confirmPw.length < 6} on:click={submit}>
    {busy ? 'Updating…' : 'Reset Password'}
  </button>
  <button class="btn" on:click={() => nav('login')}>Sign in</button>
</div>

