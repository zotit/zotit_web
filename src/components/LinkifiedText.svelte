<script lang="ts">
  import { linkify } from '../lib/linkify';

  export let text = '';

  $: parts = linkify(text);
</script>

{#each parts as part, i (i)}
  {#if part.type === 'link'}
    <a class="textLink" href={part.href} target="_blank" rel="noopener noreferrer">{part.value}</a>
  {:else}
    {part.value}
  {/if}
{/each}
