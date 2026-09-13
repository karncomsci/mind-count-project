<script setup lang="ts">
import QuotationPrintPreview from './QuotationPrintPreview.vue'
import { calculateTotals } from '../services/calculations'
import type { QuotationRecord } from '../types'
defineProps<{ records: QuotationRecord[]; mode: 'document' | 'envelope' }>()
</script>
<template>
  <div class="print-batch">
    <template v-for="record in records" :key="record.id">
      <QuotationPrintPreview
        v-if="mode === 'document'"
        :draft="record.draft"
        :number="record.number"
        :totals="calculateTotals(record.draft)"
      />
      <article v-else class="envelope-sheet">
        <p class="text-xs text-slate-500">เอกสาร {{ record.number }}</p>
        <div class="envelope-recipient">
          <p>กรุณาส่ง</p>
          <p class="font-semibold">{{ record.draft.customer.name }}</p>
          <p class="whitespace-pre-line">{{ record.draft.customer.address }}</p>
          <p>{{ record.draft.customer.postalCode }}</p>
        </div>
      </article>
    </template>
  </div>
</template>
