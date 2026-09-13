<script setup lang="ts">
import type { QuotationStatus } from '../types'
import { statusLabels } from '../services/status'
defineProps<{ status: QuotationStatus }>()
</script>

<template>
  <span class="status-badge" :class="`status-${status}`">
    <span class="h-1.5 w-1.5 rounded-full bg-current" />
    {{ statusLabels[status] }}
  </span>
</template>
