<script setup lang="ts">
import SalesDocumentTable from '~/components/sales/SalesDocumentTable.vue'
import type { SalesSort } from '~/components/sales/table'
import QuotationStatusMenu from './QuotationStatusMenu.vue'
import QuotationActionsMenu from './QuotationActionsMenu.vue'
import type { QuotationAction } from '../services/actions'
import { calculateTotals } from '../services/calculations'
import { formatDate, formatMoney } from '../services/format'
import type { QuotationRecord, QuotationStatus } from '../types'
const props = defineProps<{
  records: QuotationRecord[]
  sort: SalesSort
  ascending: boolean
  busy?: boolean
}>()
const selected = defineModel<string[]>('selected', { required: true })
defineEmits<{
  sort: [sort: SalesSort]
  status: [record: QuotationRecord, status: QuotationStatus]
  action: [record: QuotationRecord, action: QuotationAction]
}>()
const rows = computed(() =>
  props.records.map((record) => ({
    id: record.id,
    number: record.number,
    date: formatDate(record.draft.date),
    due:
      record.draft.creditMode === 'days'
        ? formatDate(record.draft.dueDate)
        : record.draft.creditMode === 'cash'
          ? 'เงินสด'
          : 'ไม่ระบุวันที่',
    customer: record.draft.customer.name,
    project: record.draft.project,
    total: formatMoney(calculateTotals(record.draft).total),
    href: `/sales/quotations/${record.id}`,
    label: 'ใบเสนอราคา',
  })),
)
function record(id: string) {
  return props.records.find((item) => item.id === id)!
}
</script>
<template>
  <SalesDocumentTable
    v-model:selected="selected"
    :rows="rows"
    title="ใบเสนอราคา"
    :sort="sort"
    :ascending="ascending"
    :busy="busy"
    @sort="$emit('sort', $event)"
  >
    <template #status="{ id }">
      <QuotationStatusMenu
        :record="record(id)"
        :disabled="busy"
        @change="$emit('status', record(id), $event)"
      />
    </template>
    <template #actions="{ id }">
      <QuotationActionsMenu
        :number="record(id).number"
        :disabled="busy"
        @action="$emit('action', record(id), $event)"
      />
    </template>
  </SalesDocumentTable>
</template>
