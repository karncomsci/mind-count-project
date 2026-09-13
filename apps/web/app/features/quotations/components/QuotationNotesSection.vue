<script setup lang="ts">
import FormField from '~/components/base/FormField.vue'
const note = defineModel<string>('note', { required: true })
const internalNote = defineModel<string>('internalNote', { required: true })
</script>

<template>
  <section aria-label="หมายเหตุ">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormField label="หมายเหตุ">
        <textarea
          v-model="note"
          class="form-input min-h-28"
          rows="4"
          placeholder="หมายเหตุที่แสดงบนเอกสาร"
        />
      </FormField>
      <FormField label="โน้ตภายในบริษัท">
        <textarea
          v-model="internalNote"
          class="form-input min-h-28"
          rows="4"
          placeholder="สำหรับทีมของคุณ ไม่แสดงบนเอกสารพิมพ์"
        />
      </FormField>
    </div>
  </section>
</template>
