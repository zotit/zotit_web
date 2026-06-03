<script lang="ts">
  import { login } from '../lib/api';
  import { nav } from '../lib/router';

  let busy = false;
  let error = '';
  let username = '';
  let password = '';

  async function submit() {
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
</script>

<div class="col" style="gap: 10px;">
  <div class="muted">Welcome to ZotIt</div>
  {#if error}
    <div class="card" style="padding: 10px; border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.08);">
      <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
      <div class="muted" style="white-space: pre-wrap;">{error}</div>
    </div>
  {/if}
  <input class="input" placeholder="Username" bind:value={username} />
  <input class="input" placeholder="Password" type="password" bind:value={password} on:keydown={(e)=>e.key==='Enter' && submit()} />
  <button class="btn primary" disabled={busy || !username || !password} on:click={submit}>
    {busy ? 'Signing in…' : 'Sign in'}
  </button>
  <div class="row" style="justify-content: space-between;">
    <button class="btn" on:click={() => nav('register')}>Register</button>
    <button class="btn ghost" on:click={() => nav('forgotpw')}>Forgot Password?</button>
  </div>
</div>

