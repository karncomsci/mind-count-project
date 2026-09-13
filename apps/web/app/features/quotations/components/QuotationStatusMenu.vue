<script setup lang="ts">
import AppDropdown from '~/components/base/AppDropdown.vue'
import AppIcon from '~/components/base/AppIcon.vue'
import type { DropdownItem } from '~/components/base/dropdown'
import { isQuotationStatus, statusLabels } from '../services/status'
import type { QuotationRecord, QuotationStatus } from '../types'
defineProps<{ record: QuotationRecord; disabled?: boolean }>()
const emit = defineEmits<{ change: [status: QuotationStatus] }>()
const conversions = [
  'สร้างใบวางบิล',
  'สร้างใบส่งสินค้า/ใบแจ้งหนี้/ใบกำกับภาษี',
  'สร้างใบกำกับภาษี/ใบเสร็จรับเงิน (เงินสด)',
  'สร้างใบสั่งซื้อ',
  'แบ่งจ่ายใบวางบิล',
  'แบ่งจ่ายใบส่งสินค้า/ใบแจ้งหนี้/ใบกำกับภาษี',
  'แบ่งจ่ายใบกำกับภาษี/ใบเสร็จรับเงิน (เงินสด)',
  'มัดจำใบวางบิล',
  'มัดจำใบส่งสินค้า/ใบแจ้งหนี้/ใบกำกับภาษี',
  'มัดจำใบกำกับภาษี/ใบเสร็จรับเงิน (เงินสด)',
]
const items: DropdownItem[] = [
  { id: 'accepted', label: 'อนุมัติ' },
  {
    id: 'conversion-note',
    label: 'สร้างเอกสารต่อ · ยังไม่เปิดใช้งาน',
    disabled: true,
    separator: true,
  },
  ...conversions.map((label, i) => ({
    id: `conversion-${i}`,
    label,
    disabled: true,
    separator: [0, 4, 7].includes(i),
  })),
  { id: 'rejected', label: 'ไม่อนุมัติ', separator: true },
  { id: 'pending', label: 'รออนุมัติ' },
  { id: 'draft', label: 'ร่าง', separator: true },
  { id: 'sent', label: 'ส่งแล้ว' },
  { id: 'expired', label: 'หมดอายุ' },
]
function select(value: string) {
  if (isQuotationStatus(value)) emit('change', value)
}
</script>
<template>
  <AppDropdown
    :label="`เปลี่ยนสถานะ ${record.number}`"
    :items="items"
    :disabled="disabled"
    wide
    class="status-select"
    :class="`status-${record.status}`"
    @select="select"
  >
    <span>{{ statusLabels[record.status] }}</span>
    <AppIcon name="down" class="h-3.5 w-3.5" />
  </AppDropdown>
</template>
