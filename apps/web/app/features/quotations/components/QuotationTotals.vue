<script setup lang="ts">
import { formatMoney } from '../services/format'
import type { QuotationTotals } from '../types'
const discount = defineModel<number>('discount', { required: true })
defineProps<{ totals: QuotationTotals; error?: string }>()
</script>

<template>
  <section class="quotation-totals" aria-label="สรุปยอดเงิน">
    <div class="total-row">
      <span>รวมเป็นเงิน</span>
      <span>{{ formatMoney(totals.subtotal) }}</span>
    </div>
    <div class="total-row">
      <label for="document-discount">ส่วนลดเพิ่มเติม (บาท)</label>
      <input
        id="document-discount"
        v-model.number="discount"
        type="number"
        min="0"
        step="0.01"
        class="form-input w-28! text-right"
        :aria-invalid="!!error"
      />
    </div>
    <p v-if="error" class="field-error">{{ error }}</p>
    <div class="total-row text-slate-400!">
      <span>ส่วนลดรวมทุกรายการ</span>
      <span>{{ formatMoney(totals.discount) }}</span>
    </div>
    <div class="total-row border-b border-slate-100 pb-4">
      <span>ราคาหลังหักส่วนลด</span>
      <span>{{ formatMoney(totals.afterDiscount) }}</span>
    </div>
    <div class="total-row pt-3">
      <span>มูลค่าที่ไม่มีภาษี</span>
      <span>{{ formatMoney(totals.exempt) }}</span>
    </div>
    <div class="total-row">
      <span>มูลค่าที่คำนวณภาษี</span>
      <span>{{ formatMoney(totals.taxable) }}</span>
    </div>
    <div class="total-row">
      <span>ภาษีมูลค่าเพิ่ม</span>
      <span>{{ formatMoney(totals.vat) }}</span>
    </div>
    <div class="grand-total">
      <span>จำนวนเงินรวมทั้งสิ้น</span>
      <span data-testid="grand-total">{{ formatMoney(totals.total) }}</span>
    </div>
    <div class="total-row mt-4">
      <span>หัก ณ ที่จ่ายทั้งสิ้น</span>
      <span>{{ formatMoney(totals.withholding) }}</span>
    </div>
    <div class="total-row font-semibold! text-slate-800!">
      <span>ยอดชำระ</span>
      <span data-testid="payable-total">{{ formatMoney(totals.payable) }}</span>
    </div>
  </section>
</template>
