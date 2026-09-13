<script setup lang="ts">
import FormField from '~/components/base/FormField.vue'
import type { PriceMode, QuotationDraft } from '../types'
defineProps<{ draft: QuotationDraft }>()
const emit = defineEmits<{ patch: [value: Partial<QuotationDraft>] }>()
</script>

<template>
  <section class="document-details" aria-label="ข้อมูลอ้างอิงและราคา">
    <div class="grid gap-4 md:grid-cols-3">
      <FormField label="โปรเจ็กต์">
        <input
          :value="draft.project"
          class="form-input"
          placeholder="ระบุโปรเจ็กต์ (ถ้ามี)"
          @input="emit('patch', { project: ($event.target as HTMLInputElement).value })"
        />
      </FormField>
      <FormField label="เลขที่อ้างอิง">
        <input
          :value="draft.reference"
          class="form-input"
          placeholder="เช่น PO20260001"
          @input="emit('patch', { reference: ($event.target as HTMLInputElement).value })"
        />
      </FormField>
      <FormField label="ราคาสินค้า">
        <select
          :value="draft.priceMode"
          class="form-input"
          @change="
            emit('patch', { priceMode: ($event.target as HTMLSelectElement).value as PriceMode })
          "
        >
          <option value="exclusive">ราคาไม่รวมภาษี</option>
          <option value="inclusive">ราคารวมภาษี</option>
        </select>
      </FormField>
    </div>
    <div class="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
      <FormField label="รายละเอียด">
        <input
          :value="draft.description"
          class="form-input"
          placeholder="รายละเอียดเพิ่มเติมของเอกสาร"
          @input="emit('patch', { description: ($event.target as HTMLInputElement).value })"
        />
      </FormField>
      <FormField label="คลังสินค้า">
        <select
          :value="draft.warehouse"
          class="form-input"
          @change="emit('patch', { warehouse: ($event.target as HTMLSelectElement).value })"
        >
          <option>คลังสินค้าหลัก</option>
          <option>คลังสินค้าสาขา</option>
        </select>
      </FormField>
    </div>
  </section>
</template>
