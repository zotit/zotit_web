<script lang="ts">
  export let label: string;
  export let type: 'text' | 'password' | 'email' = 'text';
  export let value = '';
  export let placeholder = '';
  export let autocomplete: string | undefined = undefined;
  export let disabled = false;
</script>

<label class="field">
  <span class="fieldLabel">{label}</span>
  <input
    class="input"
    {type}
    {placeholder}
    autocomplete={autocomplete as import('svelte/elements').HTMLInputAttributes['autocomplete']}
    {disabled}
    bind:value
    on:keydown
  />
</label>
