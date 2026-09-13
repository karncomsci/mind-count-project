<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import { sampleProducts } from '../services/fixtures'
import { formatMoney } from '../services/format'
import type { LineTotals, QuotationLine } from '../types'
const items = defineModel<QuotationLine[]>({ required: true })
defineProps<{
  totals: LineTotals[]
  errors: Record<string, string>
  beforeTax?: boolean
  showWithholdingAmount?: boolean
}>()
defineEmits<{ add: []; remove: [id: string] }>()
function patch(id: string, value: Partial<QuotationLine>) {
  items.value = items.value.map((item) => (item.id === id ? { ...item, ...value } : item))
}
function describe(id: string, description: string) {
  const product = sampleProducts.find((product) => product.name === description)
  patch(
    id,
    product ? { description, unitPrice: product.price, unit: product.unit } : { description },
  )
}
</script>

<template>
  <section aria-label="รายการสินค้า">
    <div class="items-table-scroll">
      <table class="items-table">
        <caption class="sr-only">สินค้าและบริการในเอกสาร</caption>
        <thead>
          <tr>
            <th class="w-10">ลำดับ</th>
            <th class="min-w-52">ชื่อสินค้า / รายละเอียด</th>
            <th class="w-20">จำนวน</th>
            <th class="w-20">หน่วย</th>
            <th class="w-28 text-right!">ราคาต่อหน่วย</th>
            <th class="w-24">ส่วนลด (%)</th>
            <th class="w-24">ภาษี</th>
            <th class="w-28">หัก ณ ที่จ่าย</th>
            <th class="w-28 text-right!">ราคารวม</th>
            <th class="w-10"><span class="sr-only">ลบ</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="item.id">
            <td class="text-center text-slate-400">{{ index + 1 }}</td>
            <td>
              <input
                :value="item.description"
                :aria-label="`ชื่อสินค้า รายการที่ ${index + 1}`"
                list="quotation-products"
                class="line-input"
                placeholder="เลือกสินค้า หรือพิมพ์รายละเอียด"
                :aria-invalid="!!errors[`items.${index}.description`]"
                @input="describe(item.id, ($event.target as HTMLInputElement).value)"
              />
              <p v-if="errors[`items.${index}.description`]" class="field-error">
                {{ errors[`items.${index}.description`] }}
              </p>
            </td>
            <td>
              <input
                :value="item.quantity"
                :aria-label="`จำนวน รายการที่ ${index + 1}`"
                type="number"
                min="0.01"
                max="100000"
                step="any"
                class="line-input text-center"
                @input="
                  patch(item.id, { quantity: Number(($event.target as HTMLInputElement).value) })
                "
              />
            </td>
            <td>
              <input
                :value="item.unit"
                :aria-label="`หน่วย รายการที่ ${index + 1}`"
                class="line-input text-center"
                @input="patch(item.id, { unit: ($event.target as HTMLInputElement).value })"
              />
            </td>
            <td>
              <input
                :value="item.unitPrice"
                :aria-label="`ราคาต่อหน่วย รายการที่ ${index + 1}`"
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                class="line-input text-right"
                @input="
                  patch(item.id, { unitPrice: Number(($event.target as HTMLInputElement).value) })
                "
              />
            </td>
            <td>
              <input
                :value="item.discountPercent"
                :aria-label="`ส่วนลด รายการที่ ${index + 1}`"
                type="number"
                min="0"
                max="100"
                step="0.01"
                class="line-input text-center"
                @input="
                  patch(item.id, {
                    discountPercent: Number(($event.target as HTMLInputElement).value),
                  })
                "
              />
            </td>
            <td>
              <select
                :value="item.vatRate"
                :aria-label="`ภาษี รายการที่ ${index + 1}`"
                class="line-input"
                @change="
                  patch(item.id, { vatRate: Number(($event.target as HTMLSelectElement).value) })
                "
              >
                <option :value="7">7%</option>
                <option :value="0">ไม่มี</option>
              </select>
            </td>
            <td>
              <select
                :value="item.withholdingRate"
                :aria-label="`หัก ณ ที่จ่าย รายการที่ ${index + 1}`"
                class="line-input"
                @change="
                  patch(item.id, {
                    withholdingRate: Number(($event.target as HTMLSelectElement).value),
                  })
                "
              >
                <option :value="0">ไม่หัก</option>
                <option :value="1">1%</option>
                <option :value="3">3%</option>
                <option :value="5">5%</option>
              </select>
              <p
                v-if="showWithholdingAmount && item.withholdingRate"
                class="mt-1 px-2 text-xs text-slate-500"
              >
                {{ formatMoney(totals[index]?.withholding ?? 0) }}
              </p>
            </td>
            <td class="text-right font-medium tabular-nums">
              {{ formatMoney((beforeTax ? totals[index]?.net : totals[index]?.total) ?? 0) }}
            </td>
            <td>
              <button
                type="button"
                class="line-delete"
                :aria-label="`ลบรายการที่ ${index + 1}`"
                @click="$emit('remove', item.id)"
              >
                <AppIcon name="trash" class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <datalist id="quotation-products">
      <option v-for="product in sampleProducts" :key="product.name" :value="product.name" />
    </datalist>
    <div class="mt-4 flex items-center justify-between gap-3">
      <button
        type="button"
        class="button button-outline-blue"
        :disabled="items.length >= 100"
        @click="$emit('add')"
      >
        <AppIcon name="plus" class="h-4 w-4" />
        เพิ่มแถวรายการ
      </button>
      <span class="text-xs text-slate-400">{{ items.length }} รายการ · THB</span>
    </div>
    <p v-if="errors.items" class="field-error">{{ errors.items }}</p>
  </section>
</template>
