<script lang="ts">
  import IconButton from './IconButton.svelte';
  import { Menu } from '@lucide/svelte';

  export let title: string;
  export let subtitle = '';
  export let showMenu = false;
  export let onMenu: (() => void) | undefined = undefined;
</script>

<div class="pageShell">
  <header class="pageHeader">
    <div class="pageHeaderMain">
      {#if showMenu}
        <button type="button" class="menuBtn" on:click={() => onMenu?.()} aria-label="Menu">
          <Menu size={20} />
        </button>
      {/if}
      <div class="pageHeaderText">
        <h1 class="pageTitle">{title}</h1>
        {#if subtitle}
          <p class="pageSubtitle">{subtitle}</p>
        {/if}
      </div>
    </div>
    {#if $$slots.actions}
      <div class="pageHeaderActions">
        <slot name="actions" />
      </div>
    {/if}
  </header>

  <div class="pageBody">
    <slot />
  </div>
</div>
