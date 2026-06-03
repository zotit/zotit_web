<script lang="ts">
  import { register } from '../lib/api';
  import { nav } from '../lib/router';

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
    // Backend returns a success string; go back to login.
    nav('login');
  }
</script>

<div class="col" style="gap: 10px;">
  <div class="muted">Create your ZotIt account</div>
  {#if error}
    <div class="card" style="padding: 10px; border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.08);">
      <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
      <div class="muted" style="white-space: pre-wrap;">{error}</div>
    </div>
  {/if}
  <input class="input" placeholder="Username" bind:value={username} />
  <input class="input" placeholder="Email" bind:value={email} />
  <input class="input" placeholder="Password (min 6 chars)" type="password" bind:value={password} />

  <label class="row" style="gap: 10px; align-items: flex-start;">
    <input type="checkbox" bind:checked={accept} style="margin-top: 2px;" />
    <div class="muted" style="font-size: 13px;">
      I accept the <a href="https://zotit.app/privacy-policy-mapp.html" target="_blank" rel="noreferrer">Privacy Policy</a>
    </div>
  </label>

  <button
    class="btn primary"
    disabled={busy || !username.trim() || !validEmail(email) || password.length < 6}
    on:click={submit}
  >
    {busy ? 'Registering…' : 'Register'}
  </button>

  <button class="btn" on:click={() => nav('login')}>Back to Sign in</button>
</div>

