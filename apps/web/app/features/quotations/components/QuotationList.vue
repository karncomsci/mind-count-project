<script setup lang="ts">
import type { SalesFilters } from '~/components/sales/search'
import { quotationStatuses } from '../services/status'
import type { SalesSort } from '~/components/sales/table'
import { sortQuotations } from '../services/list'
import AppIcon from '~/components/base/AppIcon.vue'
import QuotationListToolbar from './QuotationListToolbar.vue'
import QuotationTable from './QuotationTable.vue'
import AppDialog from '~/components/base/AppDialog.vue'
import QuotationPrintBatch from './QuotationPrintBatch.vue'
import QuotationShareDialog from './QuotationShareDialog.vue'
import { useQuotationActions } from '../composables/useQuotationActions'
import { useQuotationsStore } from '../stores/quotations'
import { downloadQuotationCsv } from '../services/export'
import type { QuotationStatus } from '../types'

const store = useQuotationsStore()
const {
  busy,
  message,
  actionError,
  deleteTarget,
  shareTarget,
  printRecords,
  printMode,
  status: changeStatus,
  download,
  print,
  confirmDelete,
  action,
} = useQuotationActions()
const route = useRoute()
const query = ref('')
const filters = ref<SalesFilters>({})
watch(filters, (value) => {
  query.value = value.query ?? ''
  status.value = quotationStatuses.find((item) => item === value.status) ?? 'all'
})
const status = ref<QuotationStatus | 'all'>('all')
const selected = ref<string[]>([])
const ascending = ref(false)
const sort = ref<SalesSort>('date')
function changeSort(key: SalesSort) {
  ascending.value = sort.value === key ? !ascending.value : true
  sort.value = key
}
const page = ref(1)
const pageSize = 6
const ready = ref(false)
onMounted(() => {
  store.hydrate()
  ready.value = true
})
const filtered = computed(() =>
  sortQuotations(
    store.records.filter((record) => {
      const search = query.value.trim().toLocaleLowerCase('th')
      return (
        (status.value === 'all' || record.status === status.value) &&
        (!filters.value.start || record.draft.date >= filters.value.start) &&
        (!filters.value.end || record.draft.date <= filters.value.end) &&
        `${record.number} ${record.draft.customer.name} ${record.draft.project} ${record.draft.description} ${record.draft.items.map((item) => item.description).join(' ')}`
          .toLocaleLowerCase('th')
          .includes(search)
      )
    }),
    sort.value,
    ascending.value,
  ).slice(0, 250),
)
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const selectedRecords = computed(() =>
  filtered.value.filter((record) => selected.value.includes(record.id)),
)
watch(pageCount, (count) => {
  page.value = Math.min(page.value, count)
})
watch(filtered, (records) => {
  selected.value = selected.value.filter((id) => records.some((record) => record.id === id))
})
const paged = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)
watch([query, status, ascending, sort, filters], () => {
  page.value = 1
  selected.value = []
})
function exportCsv() {
  const rows = filtered.value.filter(
    (record) => selected.value.length === 0 || selected.value.includes(record.id),
  )
  downloadQuotationCsv(rows)
}
</script>

<template>
  <section class="screen-document" :inert="!ready" :aria-busy="busy">
    <div class="page-heading">
      <div>
        <p class="eyebrow">
          เอกสารการขาย
          <span class="mx-2">/</span>
          ใบเสนอราคา
        </p>
        <h1>ใบเสนอราคา</h1>
      </div>
      <NuxtLink to="/sales/quotations/new" class="button button-green">
        <AppIcon name="plus" />
        สร้างใหม่
      </NuxtLink>
    </div>
    <p v-if="message || route.query.saved" role="status" class="success-notice">
      <AppIcon name="check" />
      {{ message || 'บันทึกใบเสนอราคาเรียบร้อยแล้ว' }}
    </p>
    <p v-if="busy" role="status" class="mb-4 text-sm text-sky-600">กำลังเตรียมเอกสาร…</p>
    <p v-if="actionError" role="alert" class="warning-notice">{{ actionError }}</p>
    <p v-if="store.storageWarning" role="alert" class="warning-notice">
      {{ store.storageWarning }}
    </p>
    <div class="list-card billing-list-card">
      <QuotationListToolbar
        v-model:filters="filters"
        v-model:query="query"
        v-model:status="status"
        :count="store.records.length"
        :selected-count="selected.length"
        :busy="busy"
        @clear="selected = []"
        @download="download(selectedRecords)"
        @print="print(selectedRecords)"
        @envelope="print(selectedRecords, 'envelope')"
        @export="exportCsv"
      />
      <QuotationTable
        v-model:selected="selected"
        :records="paged"
        :ascending="ascending"
        :sort="sort"
        :busy="busy"
        @status="changeStatus"
        @action="action"
        @sort="changeSort"
      />
      <div class="table-pagination">
        <p>
          แสดง {{ filtered.length ? (page - 1) * pageSize + 1 : 0 }}–{{
            Math.min(page * pageSize, filtered.length)
          }}
          จาก {{ filtered.length }} รายการ
        </p>
        <div class="flex items-center gap-2">
          <button
            class="pagination-button"
            :disabled="page <= 1"
            aria-label="หน้าก่อนหน้า"
            @click="page--"
          >
            <AppIcon name="chevron" class="h-4 w-4 rotate-180" />
          </button>
          <span class="page-number">{{ page }}</span>
          <span class="px-1 text-xs">จาก {{ pageCount }}</span>
          <button
            class="pagination-button"
            :disabled="page >= pageCount"
            aria-label="หน้าถัดไป"
            @click="page++"
          >
            <AppIcon name="chevron" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </section>
  <QuotationPrintBatch :records="printRecords" :mode="printMode" />
  <QuotationShareDialog v-if="shareTarget" :record="shareTarget" @close="shareTarget = null" />
  <AppDialog v-if="deleteTarget" title="ลบใบเสนอราคา" @close="deleteTarget = null">
    <p>ต้องการลบ {{ deleteTarget.number }} ของ {{ deleteTarget.draft.customer.name }} หรือไม่?</p>
    <p class="mt-2">เมื่อลบแล้วจะไม่สามารถเรียกคืนได้</p>
    <p v-if="actionError" role="alert" class="mt-3 text-rose-600">{{ actionError }}</p>
    <template #actions>
      <button
        type="button"
        class="button button-white"
        :disabled="busy"
        @click="deleteTarget = null"
      >
        ยกเลิก
      </button>
      <button
        type="button"
        class="button border-rose-600 bg-rose-600 text-white"
        :disabled="busy"
        @click="confirmDelete"
      >
        ยืนยันลบ
      </button>
    </template>
  </AppDialog>
</template>
