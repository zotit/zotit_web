<script lang="ts">
  export let open = false;
  export let title = 'Are you sure?';
  export let message = '';
  export let confirmLabel = 'Confirm';
  export let cancelLabel = 'Cancel';
  export let variant: 'danger' | 'primary' = 'primary';
  export let busy = false;
  export let onConfirm: () => void = () => {};
  export let onCancel: () => void = () => {};
</script>

{#if open}
  <button type="button" class="overlay" on:click={onCancel} aria-label="Close"></button>
  <div class="confirmDialog card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
    <div id="confirm-title" class="confirmTitle">{title}</div>
    {#if message}
      <p class="confirmMessage">{message}</p>
    {/if}
    <div class="confirmActions">
      <button type="button" class="btn ghost" on:click={onCancel} disabled={busy}>{cancelLabel}</button>
      <button
        type="button"
        class="btn {variant === 'danger' ? 'danger' : 'primary'}"
        on:click={onConfirm}
        disabled={busy}
      >
        {busy ? 'Please wait…' : confirmLabel}
      </button>
    </div>
  </div>
{/if}
