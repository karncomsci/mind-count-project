<script setup lang="ts">
import FormField from '~/components/base/FormField.vue'
import QuotationCreditField from './QuotationCreditField.vue'
import { addDays, formatMoney } from '../services/format'
import { updateCreditTerms, type CreditTerms } from '../services/credit-terms'
import type { QuotationDraft } from '../types'
const props = defineProps<{
  draft: QuotationDraft
  total: number
  errors: Record<string, string>
}>()
const emit = defineEmits<{ patch: [value: Partial<QuotationDraft>] }>()
function patchTerms(patch: Partial<CreditTerms>) {
  const { date, creditDays, creditMode, dueDate } = props.draft
  emit('patch', updateCreditTerms({ date, creditDays, creditMode, dueDate }, patch))
}
</script>

<template>
  <section aria-label="รายละเอียดเอกสาร">
    <div class="document-total">
      <p>
        จำนวนเงินรวมทั้งสิ้น
        <span class="ml-2 text-[10px] text-slate-400">THB</span>
      </p>
      <p class="document-total-value" data-testid="document-total">{{ formatMoney(total) }}</p>
    </div>
    <div class="document-meta-fields">
      <FormField label="วันที่" :error="errors.date" required>
        <input
          :value="draft.date"
          type="date"
          class="form-input"
          @input="patchTerms({ date: ($event.target as HTMLInputElement).value })"
        />
      </FormField>
      <QuotationCreditField
        :mode="draft.creditMode"
        :days="draft.creditDays"
        :error="errors.creditDays || errors.creditMode"
        @mode="patchTerms({ creditMode: $event })"
        @days="patchTerms({ creditDays: $event })"
      />
      <FormField v-if="draft.creditMode === 'days'" label="ครบกำหนด" :error="errors.dueDate">
        <input
          :value="draft.dueDate"
          type="date"
          :min="draft.date"
          :max="addDays(draft.date, 365)"
          :aria-invalid="!!errors.dueDate"
          class="form-input"
          @input="patchTerms({ dueDate: ($event.target as HTMLInputElement).value })"
        />
      </FormField>
      <FormField label="พนักงานขาย">
        <select
          :value="draft.salesperson"
          class="form-input"
          @change="emit('patch', { salesperson: ($event.target as HTMLSelectElement).value })"
        >
          <option>ผู้ดูแลระบบ</option>
          <option>ทีมขาย</option>
        </select>
      </FormField>
      <FormField label="สกุลเงิน">
        <div class="currency-field">
          <span class="thai-flag" aria-hidden="true" />
          THB — ไทย
          <span class="ml-auto text-xs text-slate-400">บาท</span>
        </div>
      </FormField>
    </div>
  </section>
</template>
