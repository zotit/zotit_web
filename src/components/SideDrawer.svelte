<script lang="ts">
  import { nav, route, type Route } from '../lib/router';
  import { clearAuth } from '../lib/storage';
  import { auth } from '../lib/auth';
  import { toggleTheme, theme } from '../lib/theme';
  import {
    StickyNote,
    Trash2,
    Tags,
    User,
    LogOut,
    X,
    Palette,
    Sun,
    Moon,
  } from '@lucide/svelte';

  export let open = false;
  export let onClose: () => void = () => {};

  type NavItem = {
    to: string;
    label: string;
    icon: typeof StickyNote;
    isActive: (r: Route) => boolean;
  };

  const items: NavItem[] = [
    {
      to: 'notes',
      label: 'Notes',
      icon: StickyNote,
      isActive: (r) => r.name === 'notes' || r.name === 'noteDetails',
    },
    {
      to: 'deleted',
      label: 'Deleted',
      icon: Trash2,
      isActive: (r) => r.name === 'deletedNotes',
    },
    {
      to: 'tags',
      label: 'Tags',
      icon: Tags,
      isActive: (r) => r.name === 'tags' || r.name === 'tagDetails',
    },
    {
      to: 'profile',
      label: 'Profile',
      icon: User,
      isActive: (r) => r.name === 'updateProfile',
    },
  ];

  function go(to: string) {
    nav(to);
    onClose();
  }

  async function logout() {
    await clearAuth();
    nav('login');
    onClose();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }
</script>

<svelte:window on:keydown={onKeydown} />

{#if open}
  <button type="button" class="sideDrawerOverlay" on:click={onClose} aria-label="Close menu"></button>
{/if}

<aside class="sideDrawer card" class:open aria-hidden={!open}>
  <header class="sideDrawerHeader">
    <div class="sideDrawerUser">
      <p class="sideDrawerGreeting">Signed in as</p>
      <p class="sideDrawerName">{$auth.username || '—'}</p>
    </div>
    <button type="button" class="sideDrawerClose" on:click={onClose} aria-label="Close menu">
      <X size={18} />
    </button>
  </header>

  <nav class="sideDrawerNav" aria-label="Main">
    {#each items as item (item.to)}
      {@const Icon = item.icon}
      <button
        type="button"
        class="sideNavItem"
        class:active={item.isActive($route)}
        on:click={() => go(item.to)}
      >
        <Icon size={18} />
        <span>{item.label}</span>
      </button>
    {/each}
  </nav>

  <footer class="sideDrawerFooter">
    <button type="button" class="sideNavItem" on:click={() => void toggleTheme()}>
      <Palette size={18} />
      <span>{$theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
      <span class="sideNavMeta">
        {#if $theme === 'dark'}
          <Sun size={16} />
        {:else}
          <Moon size={16} />
        {/if}
      </span>
    </button>
    <button type="button" class="sideNavItem danger" on:click={logout}>
      <LogOut size={18} />
      <span>Log out</span>
    </button>
  </footer>
</aside>
