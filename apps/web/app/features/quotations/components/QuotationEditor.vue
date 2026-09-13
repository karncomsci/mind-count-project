<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'
import AppIcon from '~/components/base/AppIcon.vue'
import QuotationCustomerSection from './QuotationCustomerSection.vue'
import QuotationDocumentSection from './QuotationDocumentSection.vue'
import QuotationDetailsSection from './QuotationDetailsSection.vue'
import QuotationItemsTable from './QuotationItemsTable.vue'
import QuotationTotals from './QuotationTotals.vue'
import QuotationNotesSection from './QuotationNotesSection.vue'
import QuotationPrintPreview from './QuotationPrintPreview.vue'
import { useQuotationEditor } from '../composables/useQuotationEditor'
import type { QuotationDraft } from '../types'

const props = defineProps<{ recordId?: string }>()
const {
  ready,
  draft,
  errors,
  saveError,
  missing,
  documentNumber,
  totals,
  dirty,
  addLine,
  removeLine,
  save,
} = useQuotationEditor(props.recordId)
const errorSummary = ref<HTMLElement | null>(null)
const saving = ref(false)
function patch(value: Partial<QuotationDraft>) {
  draft.value = { ...draft.value, ...value }
}
async function submit() {
  if (saving.value) return
  saving.value = true
  const result = save()
  if (result) await navigateTo({ path: '/sales/quotations', query: { saved: result.number } })
  else {
    await nextTick()
    errorSummary.value?.focus()
  }
  saving.value = false
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(
  () => !dirty.value || window.confirm('มีข้อมูลที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?'),
)
function printDocument() {
  window.print()
}
</script>

<template>
  <section v-if="missing" class="empty-state">
    <AppIcon name="document" class="h-12 w-12" />
    <h1 class="mt-4">ไม่พบใบเสนอราคานี้</h1>
    <NuxtLink class="button button-blue mt-5" to="/sales/quotations">กลับไปรายการ</NuxtLink>
  </section>
  <template v-else>
    <form
      class="quotation-editor screen-document"
      :inert="!ready"
      novalidate
      @submit.prevent="submit"
    >
      <header class="editor-header">
        <div class="flex items-start gap-4">
          <NuxtLink to="/sales/quotations" class="editor-back" aria-label="กลับไปรายการใบเสนอราคา">
            <AppIcon name="arrow" />
          </NuxtLink>
          <div>
            <h1 class="flex items-center gap-2 text-sm font-medium text-slate-600">
              <AppIcon name="document" class="h-4 w-4 text-sky-500" />
              {{ recordId ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคา' }}
            </h1>
            <p class="mt-1 text-2xl font-medium tracking-tight text-sky-600">
              {{ documentNumber }}
            </p>
          </div>
        </div>
        <div class="editor-actions">
          <NuxtLink to="/sales/quotations" class="button button-white">ปิดหน้าต่าง</NuxtLink>
          <button type="submit" class="button button-green" :disabled="!ready || saving">
            <AppIcon name="check" class="h-4 w-4" />
            {{ saving ? 'กำลังบันทึก…' : 'บันทึกเอกสาร' }}
          </button>
        </div>
      </header>
      <div class="document-card">
        <div class="document-topbar">
          <span class="demo-badge">
            <AppIcon name="info" class="h-3.5 w-3.5" />
            เอกสารตัวอย่าง · บันทึกในเบราว์เซอร์
          </span>
          <button type="button" class="text-action" @click="printDocument">
            <AppIcon name="print" class="h-4 w-4" />
            พิมพ์ / บันทึก PDF
          </button>
        </div>
        <div
          v-if="Object.keys(errors).length || saveError"
          ref="errorSummary"
          tabindex="-1"
          role="alert"
          class="form-errors"
        >
          <p class="font-semibold">{{ saveError || 'กรุณาตรวจสอบข้อมูลก่อนบันทึก' }}</p>
          <ul v-if="Object.keys(errors).length" class="mt-2 list-inside list-disc">
            <li v-for="(message, key) in errors" :key="key">{{ message }}</li>
          </ul>
        </div>
        <div class="document-parties">
          <QuotationCustomerSection v-model="draft.customer" :errors="errors" />
          <QuotationDocumentSection
            :draft="draft"
            :total="totals.total"
            :errors="errors"
            @patch="patch"
          />
        </div>
        <QuotationDetailsSection :draft="draft" @patch="patch" />
        <QuotationItemsTable
          v-model="draft.items"
          :totals="totals.lines"
          :errors="errors"
          @add="addLine"
          @remove="removeLine"
        />
        <div class="document-bottom">
          <QuotationNotesSection
            v-model:note="draft.note"
            v-model:internal-note="draft.internalNote"
          />
          <QuotationTotals
            v-model:discount="draft.documentDiscount"
            :totals="totals"
            :error="errors.documentDiscount"
          />
        </div>
        <div class="document-footer">
          <span>ตรวจสอบรายละเอียดก่อนบันทึกเอกสาร</span>
          <span>
            {{ draft.priceMode === 'inclusive' ? 'ราคารวมภาษี' : 'ราคาไม่รวมภาษี' }} · THB
          </span>
        </div>
      </div>
    </form>
    <QuotationPrintPreview :draft="draft" :number="documentNumber" :totals="totals" />
  </template>
</template>
