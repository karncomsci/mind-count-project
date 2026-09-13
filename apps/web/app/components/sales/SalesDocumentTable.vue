<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import type { SalesTableRow, SalesSort } from './table'
const props = defineProps<{
  rows: SalesTableRow[]
  title: string
  sort: SalesSort
  ascending: boolean
  busy?: boolean
}>()
const selected = defineModel<string[]>('selected', { required: true })
const emit = defineEmits<{ sort: [sort: SalesSort] }>()
const columns: { id: SalesSort; label: string }[] = [
  { id: 'date', label: 'วันที่' },
  { id: 'number', label: 'เลขที่เอกสาร' },
  { id: 'customer', label: 'ชื่อลูกค้า/ชื่อโปรเจ็ค' },
  { id: 'due', label: 'วันครบกำหนด' },
  { id: 'total', label: 'ยอดรวมสุทธิ' },
]
const allSelected = computed(
  () => props.rows.length > 0 && props.rows.every((record) => selected.value.includes(record.id)),
)
const someSelected = computed(() => props.rows.some((record) => selected.value.includes(record.id)))
function toggleAll() {
  selected.value = allSelected.value
    ? selected.value.filter((id) => !props.rows.some((record) => record.id === id))
    : [...new Set([...selected.value, ...props.rows.map((record) => record.id)])]
}
function toggle(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((value) => value !== id)
    : [...selected.value, id]
}
function ariaSort(key: SalesSort) {
  return props.sort === key ? (props.ascending ? 'ascending' : 'descending') : 'none'
}
</script>
<template>
  <div class="quotation-table-scroll">
    <table class="quotation-table billing-data-table">
      <caption class="sr-only">รายการ{{ title }}</caption>
      <thead>
        <tr>
          <th class="w-10">
            <input
              type="checkbox"
              aria-label="เลือกทั้งหมดในหน้านี้"
              :checked="allSelected"
              :indeterminate="someSelected && !allSelected"
              :disabled="!rows.length || busy"
              @change="toggleAll"
            />
          </th>
          <th
            v-for="column in columns"
            :key="column.id"
            :aria-sort="ariaSort(column.id)"
            :class="{ 'text-right!': column.id === 'total' }"
          >
            <button
              type="button"
              class="inline-flex items-center gap-2"
              @click="emit('sort', column.id)"
            >
              {{ column.label }}
              <AppIcon
                name="down"
                class="h-3 w-3"
                :class="{
                  'rotate-180': sort === column.id && ascending,
                  'opacity-40': sort !== column.id,
                }"
              />
            </button>
          </th>
          <th><span class="sr-only">สกุลเงิน</span></th>
          <th :aria-sort="ariaSort('status')">
            <button
              type="button"
              class="inline-flex items-center gap-2"
              @click="emit('sort', 'status')"
            >
              สถานะ
              <AppIcon
                name="down"
                class="h-3 w-3"
                :class="{ 'rotate-180': sort === 'status' && ascending }"
              />
            </button>
          </th>
          <th class="w-10"><span class="sr-only">เมนูรายการ</span></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="record in rows"
          :key="record.id"
          :class="{ 'selected-row': selected.includes(record.id) }"
        >
          <td>
            <input
              type="checkbox"
              :aria-label="`เลือก ${record.number}`"
              :checked="selected.includes(record.id)"
              :disabled="busy"
              @change="toggle(record.id)"
            />
          </td>
          <td class="whitespace-nowrap text-slate-500">{{ record.date }}</td>
          <td>
            <span v-if="record.deletedAt" class="text-slate-400">{{ record.number }}</span>
            <NuxtLink v-else :to="record.href!" class="document-link">
              {{ record.number }}
            </NuxtLink>
            <p class="mt-1 text-[10px] text-slate-400">
              {{ record.label }}
            </p>
          </td>
          <td>
            <p class="font-medium text-slate-700">{{ record.customer }}</p>
            <p class="mt-1 max-w-56 truncate text-xs text-slate-400" :title="record.project">
              {{ record.project || '—' }}
            </p>
          </td>
          <td class="whitespace-nowrap text-slate-500">
            {{ record.due }}
          </td>
          <td
            class="whitespace-nowrap text-right font-semibold tabular-nums text-slate-700"
            data-testid="billing-net-total"
          >
            {{ record.total }}
          </td>
          <td class="text-[10px]! text-slate-400">THB</td>
          <td>
            <slot :id="record.id" name="status" />
          </td>
          <td>
            <slot :id="record.id" name="actions" />
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="!rows.length" class="empty-state">
      <AppIcon name="document" class="mb-4 h-12 w-12 text-slate-300" />
      <p>ไม่พบ{{ title }}</p>
      <p class="mt-2 text-sm text-slate-400">ลองเปลี่ยนคำค้นหา ตัวกรอง หรือสร้างเอกสารใหม่</p>
    </div>
  </div>
</template>
