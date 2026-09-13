<script setup lang="ts">
defineProps<{ label: string; error?: string; required?: boolean }>()
</script>

<template>
  <label class="form-field">
    <span class="field-label">
      {{ label }}
      <span v-if="required" class="text-rose-500">*</span>
    </span>
    <slot />
    <span v-if="error" class="field-error">{{ error }}</span>
  </label>
</template>
