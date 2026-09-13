<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import BillingListSearch from './BillingListSearch.vue'
import type { BillingFilters } from '../services/list'
const kind = defineModel<'all' | 'billing' | 'consolidated'>('kind', { required: true })
const filters = defineModel<BillingFilters>('filters', { required: true })
defineProps<{ selectedCount: number; busy: boolean; canExport: boolean }>()
defineEmits<{ clear: []; export: []; print: [] }>()
const kinds = [
  { id: 'all', label: 'แสดงทั้งหมด' },
  { id: 'billing', label: 'ใบวางบิล' },
  { id: 'consolidated', label: 'ใบวางบิลรวม' },
] as const
</script>
<template>
  <div class="list-toolbar billing-list-toolbar">
    <div class="flex min-w-0 flex-wrap items-center gap-3">
      <span v-if="selectedCount" class="selection-pill">
        เลือก {{ selectedCount }} รายการ
        <button type="button" aria-label="ยกเลิกการเลือกทั้งหมด" @click="$emit('clear')">
          <AppIcon name="close" class="h-4 w-4" />
        </button>
      </span>
      <div v-else class="billing-type-filters" role="group" aria-label="ประเภทเอกสาร">
        <button
          v-for="item in kinds"
          :key="item.id"
          type="button"
          :aria-pressed="kind === item.id"
          @click="kind = item.id"
        >
          <AppIcon
            v-if="item.id !== 'all'"
            :name="item.id === 'billing' ? 'document' : 'copy'"
            class="h-4 w-4"
          />
          {{ item.label }}
        </button>
      </div>
      <span class="h-6 w-px bg-slate-200" />
      <button
        type="button"
        class="batch-action"
        :aria-label="selectedCount ? 'ส่งออก CSV ที่เลือก' : 'ส่งออก CSV'"
        title="ส่งออก CSV สำหรับเปิดใน Excel"
        :disabled="busy || !canExport"
        @click="$emit('export')"
      >
        <AppIcon name="download" />
      </button>
      <button
        v-if="selectedCount"
        type="button"
        class="batch-action"
        aria-label="พิมพ์เอกสารที่เลือก"
        :disabled="busy"
        @click="$emit('print')"
      >
        <AppIcon name="print" />
      </button>
    </div>
    <BillingListSearch v-model="filters" />
  </div>
</template>
