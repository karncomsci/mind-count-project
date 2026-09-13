<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import { salesDocuments } from '~/constants/sales-navigation'
const route = useRoute()
const document = computed(() => salesDocuments.find((item) => item.slug === route.params.document))
definePageMeta({
  validate: (route) =>
    ['billing-notes', 'invoices', 'receipts', 'cash-sales', 'credit-notes', 'debit-notes'].includes(
      String(route.params.document),
    ),
})
useHead(() => ({ title: `${document.value?.label ?? 'เอกสารการขาย'} · Mind Count` }))
</script>
<template>
  <section>
    <div class="page-heading">
      <div>
        <p class="eyebrow">เอกสารการขาย / {{ document?.label }}</p>
        <h1>{{ document?.label }}</h1>
      </div>
    </div>
    <div class="list-card empty-state">
      <AppIcon name="document" class="mb-4 h-12 w-12 text-slate-300" />
      <p class="font-medium text-slate-600">เตรียมใช้งาน{{ document?.label }}</p>
      <p class="mt-2 text-sm text-slate-400">รายละเอียดของหน้านี้จะเพิ่มในภายหลัง</p>
    </div>
  </section>
</template>
