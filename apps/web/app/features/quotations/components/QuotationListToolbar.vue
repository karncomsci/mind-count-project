<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import type { QuotationStatus } from '../types'
import { quotationStatuses, statusLabels } from '../services/status'
const query = defineModel<string>('query', { required: true })
const status = defineModel<QuotationStatus | 'all'>('status', { required: true })
defineProps<{ count: number; selectedCount: number; busy?: boolean }>()
defineEmits<{ export: []; clear: []; download: []; print: []; envelope: [] }>()
</script>

<template>
  <div class="list-toolbar">
    <div class="flex flex-wrap items-center gap-3">
      <span v-if="selectedCount" class="selection-pill">
        เลือก {{ selectedCount }} รายการ
        <button type="button" aria-label="ยกเลิกการเลือกทั้งหมด" @click="$emit('clear')">
          <AppIcon name="close" class="h-4 w-4" />
        </button>
      </span>
      <select v-else v-model="status" aria-label="กรองตามสถานะ" class="status-filter">
        <option value="all">แสดงทั้งหมด ({{ count }})</option>
        <option v-for="value in quotationStatuses" :key="value" :value="value">
          {{ statusLabels[value] }}
        </option>
      </select>
      <span class="h-6 w-px bg-slate-200" />
      <template v-if="selectedCount">
        <button
          type="button"
          class="batch-action"
          aria-label="ดาวน์โหลด PDF ที่เลือก"
          title="ดาวน์โหลด PDF"
          :disabled="busy"
          @click="$emit('download')"
        >
          <AppIcon name="download" />
        </button>
        <button
          type="button"
          class="batch-action"
          aria-label="พิมพ์เอกสารที่เลือก"
          title="พิมพ์เอกสาร"
          :disabled="busy"
          @click="$emit('print')"
        >
          <AppIcon name="print" />
        </button>
        <button
          type="button"
          class="batch-action"
          aria-label="พิมพ์จ่าหน้าซองที่เลือก"
          title="พิมพ์จ่าหน้าซอง"
          :disabled="busy"
          @click="$emit('envelope')"
        >
          <AppIcon name="envelope" />
        </button>
      </template>
      <button class="text-action" @click="$emit('export')">
        <AppIcon name="download" class="h-4 w-4" />
        ส่งออก{{ selectedCount ? ` (${selectedCount})` : '' }}
      </button>
    </div>
    <div class="search-input">
      <AppIcon name="search" class="h-4 w-4 text-slate-400" />
      <input
        v-model="query"
        type="search"
        aria-label="ค้นหาใบเสนอราคา"
        placeholder="ค้นหาเลขที่เอกสาร หรือชื่อลูกค้า"
      />
    </div>
  </div>
</template>
