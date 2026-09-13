<script setup lang="ts">
import AppDropdown from '~/components/base/AppDropdown.vue'
import AppIcon from '~/components/base/AppIcon.vue'
import { rowActions, isQuotationAction, type QuotationAction } from '../services/actions'
defineProps<{ number: string; disabled?: boolean }>()
const emit = defineEmits<{ action: [action: QuotationAction] }>()
function select(value: string) {
  if (isQuotationAction(value)) emit('action', value)
}
</script>
<template>
  <AppDropdown
    :label="`จัดการ ${number}`"
    :items="[...rowActions]"
    :disabled="disabled"
    class="row-actions-trigger"
    @select="select"
  >
    <AppIcon name="more" />
  </AppDropdown>
</template>
