<script lang="ts">
  import { nav } from '../lib/router';
  import { clearAuth, loadAuth } from '../lib/storage';
  import { onMount } from 'svelte';

  export let open = false;
  export let onClose: () => void = () => {};

  let username = '';
  onMount(async () => {
    const a = await loadAuth();
    username = a?.username ?? '';
  });

  async function logout() {
    await clearAuth();
    nav('login');
    onClose();
  }
</script>

{#if open}
  <div
    role="button"
    tabindex="0"
    on:click={onClose}
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    style="position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 50;"
  ></div>
{/if}

<aside
  class="card"
  style="
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-width: 80vw;
    padding: 14px;
    z-index: 60;
    transform: translateX({open ? '0' : '-110%'});
    transition: transform 140ms ease;
    border-radius: 0;
  "
>
  <div style="padding: 10px 8px 16px;">
    <div class="topbarTitle" style="font-size: 34px;">Hi</div>
    <div style="font-family: 'Satisfy', var(--font); font-size: 34px; margin-top: 2px;">
      {username || '—'}
    </div>
  </div>

  <div class="col" style="gap: 8px;">
    <button class="btn" on:click={() => (nav('notes'), onClose())}>Notes</button>
    <button class="btn" on:click={() => (nav('deleted'), onClose())}>Deleted Notes</button>
    <button class="btn" on:click={() => (nav('profile'), onClose())}>Update Profile</button>
    <button class="btn" on:click={() => (nav('tags'), onClose())}>Tags</button>
    <div style="height: 8px;"></div>
    <button class="btn danger" on:click={logout}>Logout</button>
  </div>
</aside>

