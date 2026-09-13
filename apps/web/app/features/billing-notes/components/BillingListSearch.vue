<script setup lang="ts">
import SalesListSearch from '~/components/sales/SalesListSearch.vue'
import { billingStatuses, billingStatusLabels } from '../services/status'
import type { BillingFilters } from '../services/list'
const filters = defineModel<BillingFilters>({ required: true })
const statuses = [
  ...billingStatuses.map((id) => ({ id, label: billingStatusLabels[id] })),
  { id: 'deleted', label: 'เอกสารที่ถูกลบ' },
]
</script>
<template><SalesListSearch v-model="filters" title="ใบวางบิล" :statuses="statuses" /></template>
