<script setup lang="ts">
import SalesListSearch from '~/components/sales/SalesListSearch.vue'
import type { SalesFilters } from '~/components/sales/search'
import SalesDocumentTable from '~/components/sales/SalesDocumentTable.vue'
import type { SalesSort } from '~/components/sales/table'
import AppIcon from '~/components/base/AppIcon.vue'
import { salesDocuments } from '~/constants/sales-navigation'
const route = useRoute()
const selected = ref<string[]>([])
const filters = ref<SalesFilters>({})
const sort = ref<SalesSort>('date')
const ascending = ref(false)
function changeSort(key: SalesSort) {
  ascending.value = sort.value === key ? !ascending.value : true
  sort.value = key
}
const document = computed(() => salesDocuments.find((item) => item.slug === route.params.document))
definePageMeta({
  validate: (route) =>
    ['invoices', 'receipts', 'cash-sales', 'credit-notes', 'debit-notes'].includes(
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
    <div class="list-card billing-list-card">
      <div class="list-toolbar billing-list-toolbar">
        <div class="flex items-center gap-3">
          <span class="status-filter">แสดงทั้งหมด</span>
          <span class="h-6 w-px bg-slate-200" />
          <button type="button" class="text-action" disabled>
            <AppIcon name="download" class="h-4 w-4" />
            ส่งออก
          </button>
        </div>
        <SalesListSearch v-model="filters" :title="document?.label ?? 'เอกสาร'" :statuses="[]" />
      </div>
      <SalesDocumentTable
        v-model:selected="selected"
        :title="document?.label ?? 'เอกสาร'"
        :rows="[]"
        :sort="sort"
        :ascending="ascending"
        @sort="changeSort"
      />
      <div class="table-pagination">
        <p>แสดง 0 จาก 0 รายการ</p>
        <span class="page-number">1</span>
      </div>
    </div>
    <p class="mt-4 text-xs text-slate-400">
      ยังไม่มีข้อมูล{{ document?.label }} และยังไม่เปิดใช้งานการสร้างเอกสารประเภทนี้
    </p>
  </section>
</template>
