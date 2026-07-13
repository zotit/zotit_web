<script lang="ts">
  import IconButton from './IconButton.svelte';
  import { toggleTheme } from '../lib/theme';
  import { Palette } from '@lucide/svelte';

  export let title: string;
  export let subtitle = '';
</script>

<div class="authPage">
  <header class="authTop">
    <div class="topbarTitle">ZotIt</div>
    <IconButton title="Theme" ariaLabel="Theme" variant="ghost" size="sm" onClick={toggleTheme}>
      <Palette size={17} />
    </IconButton>
  </header>

  <div class="authIntro">
    <h1 class="authTitle">{title}</h1>
    {#if subtitle}
      <p class="authSubtitle">{subtitle}</p>
    {/if}
  </div>

  <div class="authCard card">
    <slot />
  </div>
</div>
