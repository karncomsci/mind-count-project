<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import QuotationStatusMenu from './QuotationStatusMenu.vue'
import QuotationActionsMenu from './QuotationActionsMenu.vue'
import type { QuotationAction } from '../services/actions'
import { calculateTotals } from '../services/calculations'
import { formatDate, formatMoney } from '../services/format'
import type { QuotationRecord, QuotationStatus } from '../types'
const props = defineProps<{ records: QuotationRecord[]; ascending: boolean; busy?: boolean }>()
const selected = defineModel<string[]>('selected', { required: true })
defineEmits<{
  sort: []
  status: [record: QuotationRecord, status: QuotationStatus]
  action: [record: QuotationRecord, action: QuotationAction]
}>()
const allSelected = computed(
  () =>
    props.records.length > 0 && props.records.every((record) => selected.value.includes(record.id)),
)
function toggle(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((value) => value !== id)
    : [...selected.value, id]
}
function toggleAll() {
  selected.value = allSelected.value
    ? selected.value.filter((id) => !props.records.some((record) => record.id === id))
    : [...new Set([...selected.value, ...props.records.map((record) => record.id)])]
}
</script>

<template>
  <div class="quotation-table-scroll">
    <table class="quotation-table">
      <caption class="sr-only">รายการใบเสนอราคา</caption>
      <thead>
        <tr>
          <th class="w-12">
            <input
              type="checkbox"
              aria-label="เลือกทั้งหมดในหน้านี้"
              :checked="allSelected"
              :indeterminate="
                records.some((record) => selected.includes(record.id)) && !allSelected
              "
              @change="toggleAll"
            />
          </th>
          <th :aria-sort="ascending ? 'ascending' : 'descending'">
            <button class="inline-flex items-center gap-2" @click="$emit('sort')">
              วันที่
              <AppIcon name="down" class="h-3 w-3" :class="{ 'rotate-180': ascending }" />
            </button>
          </th>
          <th>เลขที่เอกสาร</th>
          <th>ชื่อลูกค้า / รายละเอียด</th>
          <th class="text-right!">ยอดรวมสุทธิ</th>
          <th>สถานะ</th>
          <th class="w-10"><span class="sr-only">เปิดเอกสาร</span></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="record in records"
          :key="record.id"
          :class="{ 'selected-row': selected.includes(record.id) }"
        >
          <td>
            <input
              type="checkbox"
              :aria-label="`เลือก ${record.number}`"
              :checked="selected.includes(record.id)"
              @change="toggle(record.id)"
            />
          </td>
          <td class="whitespace-nowrap text-xs text-slate-500">
            {{ formatDate(record.draft.date) }}
          </td>
          <td>
            <NuxtLink :to="`/sales/quotations/${record.id}`" class="document-link">
              {{ record.number }}
            </NuxtLink>
            <p class="mt-1 text-[10px] text-slate-400">ใบเสนอราคา</p>
          </td>
          <td>
            <p class="font-medium text-slate-700">{{ record.draft.customer.name }}</p>
            <p class="mt-1 max-w-64 truncate text-xs text-slate-400">
              {{ record.draft.project || record.draft.items[0]?.description }}
            </p>
          </td>
          <td class="whitespace-nowrap text-right font-semibold tabular-nums text-slate-700">
            {{ formatMoney(calculateTotals(record.draft).total) }}
            <span class="ml-1 text-[10px] font-normal text-slate-400">THB</span>
          </td>
          <td>
            <QuotationStatusMenu
              :record="record"
              :disabled="busy"
              @change="$emit('status', record, $event)"
            />
          </td>
          <td>
            <QuotationActionsMenu
              :number="record.number"
              :disabled="busy"
              @action="$emit('action', record, $event)"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="records.length === 0" class="empty-state">
      <AppIcon name="document" class="mb-4 h-12 w-12 text-slate-300" />
      <p class="font-medium text-slate-600">ไม่พบใบเสนอราคา</p>
      <p class="mt-2 text-sm text-slate-400">ลองเปลี่ยนคำค้นหา ตัวกรอง หรือสร้างเอกสารใหม่</p>
    </div>
  </div>
</template>
