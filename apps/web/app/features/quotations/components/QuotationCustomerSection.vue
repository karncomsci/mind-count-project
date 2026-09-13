<script setup lang="ts">
import FormField from '~/components/base/FormField.vue'
import AppIcon from '~/components/base/AppIcon.vue'
import { sampleCustomers } from '../services/fixtures'
import type { Customer } from '../types'
const customer = defineModel<Customer>({ required: true })
defineProps<{ errors: Record<string, string> }>()
function update(key: keyof Customer, value: string) {
  const selected = key === 'name' ? sampleCustomers.find((item) => item.name === value) : undefined
  customer.value = selected ? { ...selected } : { ...customer.value, [key]: value }
}
</script>

<template>
  <section aria-labelledby="customer-heading">
    <h2 id="customer-heading" class="section-heading">
      <AppIcon name="users" />
      ข้อมูลลูกค้า
    </h2>
    <FormField label="ชื่อลูกค้า" :error="errors['customer.name']" required>
      <input
        :value="customer.name"
        class="form-input"
        list="quotation-customers"
        placeholder="เลือกลูกค้า หรือพิมพ์เพื่อสร้างใหม่"
        :aria-invalid="!!errors['customer.name']"
        @input="update('name', ($event.target as HTMLInputElement).value)"
      />
      <datalist id="quotation-customers">
        <option v-for="item in sampleCustomers" :key="item.name" :value="item.name" />
      </datalist>
    </FormField>
    <FormField label="ที่อยู่" class="mt-4">
      <textarea
        :value="customer.address"
        class="form-input min-h-24 resize-y"
        rows="3"
        placeholder="รายละเอียดที่อยู่"
        @input="update('address', ($event.target as HTMLTextAreaElement).value)"
      />
    </FormField>
    <div class="mt-3 grid grid-cols-2 gap-3">
      <FormField label="รหัสไปรษณีย์" :error="errors['customer.postalCode']">
        <input
          :value="customer.postalCode"
          class="form-input"
          placeholder="รหัสไปรษณีย์"
          inputmode="numeric"
          maxlength="5"
          @input="update('postalCode', ($event.target as HTMLInputElement).value)"
        />
      </FormField>
      <FormField label="สำนักงาน / สาขา">
        <input
          :value="customer.branch"
          class="form-input"
          placeholder="สำนักงานใหญ่"
          @input="update('branch', ($event.target as HTMLInputElement).value)"
        />
      </FormField>
    </div>
    <FormField label="เลขประจำตัวผู้เสียภาษี" class="mt-3" :error="errors['customer.taxId']">
      <input
        :value="customer.taxId"
        class="form-input"
        placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก"
        inputmode="numeric"
        maxlength="13"
        @input="update('taxId', ($event.target as HTMLInputElement).value)"
      />
    </FormField>
  </section>
</template>
