<script setup lang="ts">
import { formatDate, formatMoney } from '../services/format'
import type { QuotationDraft, QuotationTotals } from '../types'
defineProps<{ draft: QuotationDraft; number: string; totals: QuotationTotals }>()
</script>

<template>
  <article class="print-document">
    <header>
      <h1>ใบเสนอราคา</h1>
      <p>{{ number }}</p>
      <p>เอกสารตัวอย่าง · Mind Count</p>
    </header>
    <div class="my-6 grid grid-cols-2 gap-8">
      <div>
        <h2>ลูกค้า</h2>
        <p>{{ draft.customer.name }}</p>
        <p class="whitespace-pre-line">
          {{ draft.customer.address }} {{ draft.customer.postalCode }}
        </p>
        <p v-if="draft.customer.taxId">เลขผู้เสียภาษี {{ draft.customer.taxId }}</p>
        <p>{{ draft.customer.branch }}</p>
      </div>
      <div>
        <p>วันที่ {{ formatDate(draft.date) }}</p>
        <template v-if="draft.creditMode === 'days'">
          <p>เครดิต {{ draft.creditDays }} วัน</p>
          <p>ครบกำหนด {{ formatDate(draft.dueDate) }}</p>
        </template>
        <p v-else>{{ draft.creditMode === 'cash' ? 'เงินสด' : 'เครดิต (ไม่แสดงวันที่)' }}</p>
        <p>พนักงานขาย {{ draft.salesperson }}</p>
        <p v-if="draft.reference">อ้างอิง {{ draft.reference }}</p>
        <p>
          สกุลเงิน THB · {{ draft.priceMode === 'inclusive' ? 'ราคารวมภาษี' : 'ราคาไม่รวมภาษี' }}
        </p>
      </div>
    </div>
    <p>{{ draft.project }} {{ draft.description }}</p>
    <table>
      <thead>
        <tr>
          <th>รายการ</th>
          <th>จำนวน</th>
          <th>ราคาต่อหน่วย</th>
          <th>ส่วนลด</th>
          <th>VAT</th>
          <th>รวม</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in draft.items" :key="item.id">
          <td>{{ item.description }}</td>
          <td>{{ item.quantity }} {{ item.unit }}</td>
          <td>{{ formatMoney(Math.round(item.unitPrice * 100)) }}</td>
          <td>{{ item.discountPercent }}%</td>
          <td>{{ item.vatRate }}%</td>
          <td>{{ formatMoney(totals.lines[index]?.total ?? 0) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="mt-6 ml-auto w-80 space-y-2">
      <p class="flex justify-between">
        <span>ส่วนลดรวม</span>
        <span>{{ formatMoney(totals.discount) }}</span>
      </p>
      <p class="flex justify-between">
        <span>ภาษีมูลค่าเพิ่ม</span>
        <span>{{ formatMoney(totals.vat) }}</span>
      </p>
      <p class="flex justify-between font-bold">
        <span>จำนวนเงินรวมทั้งสิ้น</span>
        <span>{{ formatMoney(totals.total) }}</span>
      </p>
      <p class="flex justify-between">
        <span>หัก ณ ที่จ่าย</span>
        <span>{{ formatMoney(totals.withholding) }}</span>
      </p>
      <p class="flex justify-between font-bold">
        <span>ยอดชำระ</span>
        <span>{{ formatMoney(totals.payable) }}</span>
      </p>
    </div>
    <p class="mt-8 whitespace-pre-line">{{ draft.note }}</p>
  </article>
</template>
