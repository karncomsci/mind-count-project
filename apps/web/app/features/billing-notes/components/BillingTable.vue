<script setup lang="ts">
import SalesDocumentTable from '~/components/sales/SalesDocumentTable.vue'
import AppIcon from '~/components/base/AppIcon.vue'
import AppDropdown from '~/components/base/AppDropdown.vue'
import type { DropdownItem } from '~/components/base/dropdown'
import { calculateTotals, formatDate, formatMoney } from '../../quotations/model'
import type { BillingRecord } from '../model'
import {
  billingStatuses,
  billingStatusClasses,
  billingStatusLabels,
  isBillingStatus,
  type BillingStatus,
} from '../services/status'
import type { BillingSort } from '../services/list'
const props = defineProps<{
  records: BillingRecord[]
  sort: BillingSort
  ascending: boolean
  busy: boolean
}>()
const selected = defineModel<string[]>('selected', { required: true })
const emit = defineEmits<{
  sort: [sort: BillingSort]
  status: [record: BillingRecord, status: BillingStatus]
  action: [record: BillingRecord, action: string]
}>()
const statusItems = billingStatuses.map((status) => ({
  id: status,
  label: billingStatusLabels[status],
}))
const actions: DropdownItem[] = [
  { id: 'edit', label: 'แก้ไข', icon: 'edit' },
  { id: 'print', label: 'พิมพ์', icon: 'print' },
  { id: 'pdf', label: 'ดาวน์โหลด PDF', icon: 'download' },
  { id: 'duplicate', label: 'สร้างซ้ำ', icon: 'copy', separator: true },
  { id: 'delete', label: 'ลบ', icon: 'trash', danger: true, separator: true },
]
function changeStatus(record: BillingRecord, status: string) {
  if (isBillingStatus(status)) emit('status', record, status)
}
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
    href: `/sales/billing-notes/${record.id}`,
    deletedAt: record.deletedAt,
    label: record.kind === 'billing' ? 'ใบวางบิล' : 'ใบวางบิลรวม',
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
    title="ใบวางบิล"
    :sort="sort"
    :ascending="ascending"
    :busy="busy"
    @sort="emit('sort', $event)"
  >
    <template #status="{ id }">
      <span v-if="record(id).deletedAt" class="status-badge status-rejected">เอกสารที่ถูกลบ</span>
      <AppDropdown
        v-else
        :label="`เปลี่ยนสถานะ ${record(id).number}`"
        :items="statusItems"
        :disabled="busy"
        class="status-select"
        :class="billingStatusClasses[record(id).status]"
        @select="changeStatus(record(id), $event)"
      >
        <span>{{ billingStatusLabels[record(id).status] }}</span>
        <AppIcon name="down" class="h-3.5 w-3.5" />
      </AppDropdown>
    </template>
    <template #actions="{ id }">
      <AppDropdown
        :label="`เมนู ${record(id).number}`"
        :items="
          record(id).deletedAt
            ? [{ id: 'restore', label: 'กู้คืนเอกสาร', icon: 'copy' }]
            : actions.filter((item) => record(id).kind === 'billing' || item.id !== 'duplicate')
        "
        :disabled="busy"
        class="row-actions-trigger"
        @select="emit('action', record(id), $event)"
      >
        <AppIcon name="more" />
      </AppDropdown>
    </template>
  </SalesDocumentTable>
</template>
