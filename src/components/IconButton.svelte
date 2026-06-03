<script lang="ts">
  export let title = '';
  export let ariaLabel = '';
  export let onClick: (() => void) | undefined = undefined;
  export let disabled = false;
  export let variant: 'default' | 'primary' | 'danger' | 'ghost' = 'default';
  export let size: 'sm' | 'md' = 'md';
</script>

<button
  type="button"
  class="iconBtn {variant} {size}"
  {disabled}
  aria-label={ariaLabel || title}
  title={title}
  on:click={() => onClick?.()}
>
  <slot />
</button>

