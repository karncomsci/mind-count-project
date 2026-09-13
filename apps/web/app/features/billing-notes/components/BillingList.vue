<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import AppDialog from '~/components/base/AppDialog.vue'
import { QuotationPrintPreview } from '~/features/quotations'
import { calculateTotals } from '../../quotations/model'
import { createDocumentPdf, downloadPdf } from '../../quotations/documents'
import BillingListToolbar from './BillingListToolbar.vue'
import BillingTable from './BillingTable.vue'
import { useBillingNotesStore } from '../stores/billing-notes'
import type { BillingRecord } from '../model'
import {
  filterBillingRecords,
  billingCsv,
  type BillingFilters,
  type BillingSort,
} from '../services/list'
import type { BillingStatus } from '../services/status'
const store = useBillingNotesStore(),
  route = useRoute()
const filters = ref<BillingFilters>({}),
  kind = ref<'all' | 'billing' | 'consolidated'>('all')
const sort = ref<BillingSort>('date'),
  ascending = ref(false),
  page = ref(1),
  selected = ref<string[]>([])
const busy = ref(false),
  error = ref(''),
  message = ref('')
const deleteTarget = ref<BillingRecord | null>(null),
  printRecords = ref<BillingRecord[]>([])
const pageSize = 10
onMounted(() => store.hydrate())
const matched = computed(() =>
  filterBillingRecords(
    store.state.records,
    { ...filters.value, kind: kind.value },
    sort.value,
    ascending.value,
  ),
)
const filtered = computed(() => matched.value.slice(0, 250))
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)
const selectedRecords = computed(() =>
  filtered.value.filter((record) => selected.value.includes(record.id)),
)
const outputRecords = computed(() =>
  selected.value.length ? selectedRecords.value : filtered.value,
)
watch([filters, kind, sort, ascending], () => {
  page.value = 1
  selected.value = []
})
watch(filtered, (records) => {
  selected.value = selected.value.filter((id) => records.some((record) => record.id === id))
  page.value = Math.min(page.value, pageCount.value)
})
function changeSort(value: BillingSort) {
  ascending.value = sort.value === value ? !ascending.value : true
  sort.value = value
}
async function changeStatus(record: BillingRecord, value: BillingStatus) {
  error.value = ''
  message.value = ''
  busy.value = true
  try {
    await store.setStatus(record.id, value)
    message.value = 'อัปเดตสถานะใบวางบิลแล้ว'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'อัปเดตสถานะไม่สำเร็จ'
  } finally {
    busy.value = false
  }
}
async function print(records: BillingRecord[]) {
  printRecords.value = records
  await nextTick()
  window.print()
}
function exportCsv() {
  downloadPdf(
    new Blob([billingCsv(outputRecords.value)], { type: 'text/csv;charset=utf-8' }),
    'billing-notes.csv',
  )
}
async function action(record: BillingRecord, value: string) {
  error.value = ''
  message.value = ''
  if (value === 'delete') {
    deleteTarget.value = record
    return
  }
  if (value === 'edit') {
    await navigateTo(`/sales/billing-notes/${record.id}`)
    return
  }
  if (value === 'print') {
    await print([record])
    return
  }
  busy.value = true
  try {
    if (value === 'pdf') {
      const pdf = await createDocumentPdf([{ ...record, status: 'draft' }], {
        title: record.kind === 'billing' ? 'ใบวางบิล' : 'ใบวางบิลรวม',
        signatureEnabled: record.draft.signatureEnabled,
      })
      downloadPdf(pdf, `${record.number}.pdf`)
    } else if (value === 'duplicate') {
      const copy = await store.duplicate(record.id)
      message.value = `สร้าง ${copy.number} เรียบร้อยแล้ว`
    } else if (value === 'restore') {
      await store.setDeleted(record.id, false)
      message.value = 'กู้คืนเอกสารเรียบร้อยแล้ว'
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'ดำเนินการไม่สำเร็จ'
  } finally {
    busy.value = false
  }
}
async function confirmDelete() {
  if (!deleteTarget.value || busy.value) return
  busy.value = true
  try {
    await store.setDeleted(deleteTarget.value.id, true)
    deleteTarget.value = null
    message.value = 'ย้ายเอกสารไปยังเอกสารที่ถูกลบแล้ว'
    error.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'ลบไม่สำเร็จ ข้อมูลเดิมยังคงอยู่'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="screen-document" :inert="!store.ready" :aria-busy="busy">
    <div class="page-heading">
      <div>
        <p class="eyebrow">
          เอกสารการขาย
          <span class="mx-2">/</span>
          ใบวางบิล
        </p>
        <h1>ใบวางบิล</h1>
      </div>
      <NuxtLink to="/sales/billing-notes/new" class="button button-green">
        <AppIcon name="plus" />
        สร้างใบวางบิล
      </NuxtLink>
    </div>
    <p v-if="message || route.query.saved" role="status" class="success-notice">
      <AppIcon name="check" />
      {{ message || `บันทึกใบวางบิล ${route.query.saved} เรียบร้อยแล้ว` }}
    </p>
    <p v-if="store.warning || error" role="alert" class="warning-notice">
      {{ store.warning || error }}
    </p>
    <p v-if="busy" role="status" class="mb-4 text-sm text-sky-600">กำลังเตรียมเอกสาร…</p>
    <button
      v-if="store.warning"
      type="button"
      class="button button-white mb-4"
      @click="store.hydrate()"
    >
      ลองโหลดข้อมูลอีกครั้ง
    </button>
    <div v-if="store.legacy" class="warning-notice flex flex-wrap items-center gap-3">
      <span>พบข้อมูลใบวางบิลเดิมในเบราว์เซอร์ {{ store.legacy.records.length }} รายการ</span>
      <button
        class="button button-white"
        :disabled="store.importing || !!store.warning"
        @click="store.importLegacy()"
      >
        {{ store.importing ? 'กำลังนำเข้า…' : 'นำเข้าข้อมูลเดิม' }}
      </button>
    </div>
    <p v-if="store.legacyWarning" role="alert" class="warning-notice">{{ store.legacyWarning }}</p>
    <div class="list-card billing-list-card">
      <BillingListToolbar
        v-model:kind="kind"
        v-model:filters="filters"
        :selected-count="selected.length"
        :busy="busy"
        :can-export="!!outputRecords.length"
        @clear="selected = []"
        @export="exportCsv"
        @print="print(selectedRecords)"
      />
      <div
        v-if="filters.query || filters.start || (filters.status && filters.status !== 'all')"
        class="border-t border-slate-100 px-5 py-2 text-xs text-slate-500"
      >
        ผลการค้นหา {{ matched.length }} รายการ
        <span v-if="filters.query">· {{ filters.query }}</span>
        <span v-if="filters.start">· {{ filters.start }} ถึง {{ filters.end }}</span>
      </div>
      <BillingTable
        v-model:selected="selected"
        :records="paged"
        :sort="sort"
        :ascending="ascending"
        :busy="busy || !!store.warning"
        @sort="changeSort"
        @status="changeStatus"
        @action="action"
      />
      <div class="table-pagination">
        <p>
          แสดง {{ filtered.length ? (page - 1) * pageSize + 1 : 0 }}–{{
            Math.min(page * pageSize, filtered.length)
          }}
          จาก {{ filtered.length }} รายการ
          <span v-if="matched.length > 250">
            (แสดงผลไม่เกิน 250 รายการ กรุณาระบุการค้นหาเพิ่มเติม)
          </span>
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="pagination-button"
            aria-label="หน้าก่อนหน้า"
            :disabled="page <= 1"
            @click="page--"
          >
            <AppIcon name="chevron" class="h-4 w-4 rotate-180" />
          </button>
          <span class="page-number">{{ page }}</span>
          <span class="text-xs">จาก {{ pageCount }}</span>
          <button
            type="button"
            class="pagination-button"
            aria-label="หน้าถัดไป"
            :disabled="page >= pageCount"
            @click="page++"
          >
            <AppIcon name="chevron" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    <p class="mt-4 text-xs text-slate-400">ข้อมูลใบวางบิลบันทึกในฐานข้อมูล</p>
  </section>
  <div class="print-batch">
    <QuotationPrintPreview
      v-for="record in printRecords"
      :key="record.id"
      :draft="record.draft"
      :number="record.number"
      :totals="calculateTotals(record.draft)"
      :title="record.kind === 'billing' ? 'ใบวางบิล' : 'ใบวางบิลรวม'"
      :signature-enabled="record.draft.signatureEnabled"
    />
  </div>
  <AppDialog v-if="deleteTarget" title="ลบใบวางบิล" @close="!busy && (deleteTarget = null)">
    <p>ต้องการลบ {{ deleteTarget.number }} หรือไม่?</p>
    <p class="mt-2">สามารถกู้คืนได้จากตัวกรองเอกสารที่ถูกลบ</p>
    <p v-if="error" role="alert" class="mt-2 text-rose-600">{{ error }}</p>
    <template #actions>
      <button class="button button-white" :disabled="busy" @click="deleteTarget = null">
        ยกเลิก
      </button>
      <button
        class="button border-rose-600 bg-rose-600 text-white"
        :disabled="busy"
        @click="confirmDelete"
      >
        ยืนยันลบ
      </button>
    </template>
  </AppDialog>
</template>
