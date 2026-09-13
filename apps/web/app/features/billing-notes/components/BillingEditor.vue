<script setup lang="ts">
import DocumentLeaveDialog from '~/components/base/DocumentLeaveDialog.vue'
import { useDocumentLeave } from '~/composables/useDocumentLeave'
import AppIcon from '~/components/base/AppIcon.vue'
import AppDropdown from '~/components/base/AppDropdown.vue'
import AppDialog from '~/components/base/AppDialog.vue'
import {
  QuotationCustomerSection,
  QuotationDocumentSection,
  QuotationItemsTable,
  QuotationTotals,
  QuotationNotesSection,
  QuotationPrintPreview,
} from '~/features/quotations'
import { formatMoney } from '../../quotations/model'
import { createDocumentPdf, downloadPdf } from '../../quotations/documents'
import BillingDetailsSection from './BillingDetailsSection.vue'
import BillingAttachments from './BillingAttachments.vue'
import { useBillingEditor } from '../composables/useBillingEditor'
import type { BillingDraft } from '../model'

const props = defineProps<{ recordId?: string }>()
const {
  store,
  draft,
  ready,
  missing,
  errors,
  saveError,
  dirty,
  number,
  totals,
  save,
  validate,
  addLine,
  removeLine,
} = useBillingEditor(props.recordId)
const errorSummary = ref<HTMLElement | null>(null)
const busy = ref(false)
const uploading = ref(false)
const { leaveOpen, leaveBusy, cancelLeave, discardAndLeave, saveAndLeave } = useDocumentLeave(
  dirty,
  async () => !busy.value && !uploading.value && !!(await save()),
  focusErrors,
)
const modal = ref<'share' | 'info' | null>(null)
const message = ref('')
const shareText = computed(
  () =>
    `ใบวางบิล ${number.value}\nลูกค้า: ${draft.value.customer.name}\nจำนวนเงินรวมทั้งสิ้น: ${formatMoney(totals.value.total)} บาท\nยอดชำระ: ${formatMoney(totals.value.payable)} บาท${draft.value.creditMode === 'days' ? `\nครบกำหนด: ${draft.value.dueDate}` : ''}`,
)
const updatedAt = computed(
  () => store.state.records.find((item) => item.id === props.recordId)?.updatedAt,
)
function patch(value: Partial<BillingDraft>) {
  draft.value = { ...draft.value, ...value }
}
async function focusErrors() {
  await nextTick()
  errorSummary.value?.focus()
}
async function submit() {
  if (busy.value || uploading.value || store.warning) return
  busy.value = true
  try {
    const result = await save()
    if (result) await navigateTo({ path: '/sales/billing-notes', query: { saved: result.number } })
    else await focusErrors()
  } finally {
    busy.value = false
  }
}
async function output(kind: 'print' | 'pdf' | 'share') {
  if (busy.value || uploading.value) return
  const parsed = validate()
  if (!parsed) {
    await focusErrors()
    return
  }
  if (kind === 'share') {
    message.value = ''
    modal.value = 'share'
    return
  }
  if (kind === 'print') {
    window.print()
    return
  }
  busy.value = true
  try {
    const pdf = await createDocumentPdf(
      [
        {
          id: props.recordId ?? 'preview',
          number: number.value,
          status: 'draft',
          updatedAt: new Date().toISOString(),
          draft: parsed,
        },
      ],
      { title: 'ใบวางบิล', signatureEnabled: parsed.signatureEnabled },
    )
    downloadPdf(pdf, `${number.value}.pdf`)
  } catch {
    saveError.value = 'สร้าง PDF ไม่สำเร็จ กรุณาลองอีกครั้ง หรือเลือกพิมพ์เพื่อบันทึกเป็น PDF'
    await focusErrors()
  } finally {
    busy.value = false
  }
}
async function copySummary() {
  try {
    await navigator.clipboard.writeText(shareText.value)
    message.value = 'คัดลอกข้อมูลแล้ว'
  } catch {
    message.value = 'คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกข้อความแล้วคัดลอก'
  }
}
</script>

<template>
  <section v-if="missing" class="empty-state">
    <AppIcon name="document" class="h-12 w-12" />
    <h1 class="mt-4">ไม่พบใบวางบิลนี้</h1>
    <NuxtLink class="button button-blue mt-5" to="/sales/billing-notes">
      กลับไปรายการใบวางบิล
    </NuxtLink>
  </section>
  <template v-else>
    <DocumentLeaveDialog
      v-if="leaveOpen"
      :busy="leaveBusy || busy || uploading"
      @cancel="cancelLeave"
      @discard="discardAndLeave"
      @save="saveAndLeave"
    />
    <form
      class="quotation-editor billing-editor screen-document"
      :inert="!ready"
      novalidate
      @submit.prevent="submit"
    >
      <header class="editor-header">
        <div class="flex items-start gap-3">
          <NuxtLink to="/sales/billing-notes" class="editor-back" aria-label="กลับไปรายการใบวางบิล">
            <AppIcon name="arrow" />
          </NuxtLink>
          <div>
            <h1 class="flex items-center gap-2 text-sm font-medium">
              <AppIcon name="document" class="h-4 w-4 text-sky-500" />
              {{ recordId ? 'แก้ไขใบวางบิล' : 'สร้างใบวางบิล' }}
            </h1>
            <p class="mt-1 text-2xl font-medium text-sky-600" data-testid="billing-number">
              {{ number }}
            </p>
          </div>
        </div>
        <div class="editor-actions">
          <NuxtLink
            to="/sales/billing-notes"
            class="button button-white"
            @click="busy && $event.preventDefault()"
          >
            ปิดหน้าต่าง
          </NuxtLink>
          <button
            type="submit"
            class="button button-green"
            :disabled="!ready || busy || uploading || !!store.warning"
          >
            {{ busy ? 'กำลังดำเนินการ…' : 'บันทึกเอกสาร' }}
          </button>
        </div>
      </header>
      <div class="document-card" :inert="busy || leaveBusy">
        <div class="billing-topbar">
          <span class="demo-badge">
            <AppIcon name="info" class="h-4 w-4" />
            {{ recordId ? 'ข้อมูลบันทึกในฐานข้อมูล' : 'เลขที่เอกสารจะยืนยันเมื่อบันทึก' }}
          </span>
          <div class="billing-toolbar">
            <button type="button" :disabled="busy" @click="output('share')">
              <AppIcon name="share" />
              <span>แชร์</span>
            </button>
            <button type="button" :disabled="busy" @click="output('print')">
              <AppIcon name="print" />
              <span>พิมพ์</span>
            </button>
            <button type="button" :disabled="busy" @click="output('pdf')">
              <AppIcon name="download" />
              <span>ดาวน์โหลด</span>
            </button>
            <AppDropdown
              label="เพิ่มเติม"
              :items="[{ id: 'info', label: 'ข้อมูลเอกสาร', icon: 'info' }]"
              @select="modal = 'info'"
            >
              <AppIcon name="more" />
              <span>เพิ่มเติม</span>
            </AppDropdown>
          </div>
        </div>
        <p v-if="store.warning" role="alert" class="warning-notice">{{ store.warning }}</p>
        <div
          v-if="Object.keys(errors).length || saveError"
          ref="errorSummary"
          role="alert"
          tabindex="-1"
          class="form-errors"
        >
          <p class="font-semibold">{{ saveError || 'กรุณาตรวจสอบข้อมูลก่อนบันทึก' }}</p>
          <ul class="list-inside list-disc">
            <li v-for="(error, key) in errors" :key="key">{{ error }}</li>
          </ul>
        </div>
        <div class="document-parties">
          <div>
            <QuotationCustomerSection v-model="draft.customer" :errors="errors" />
            <p class="mt-4 text-xs text-slate-500">
              ที่ตั้งธุรกิจ:
              <span class="ml-3 text-slate-800">ไทย</span>
            </p>
          </div>
          <QuotationDocumentSection
            :draft="draft"
            :total="totals.total"
            :errors="errors"
            @patch="patch"
          />
        </div>
        <BillingDetailsSection :draft="draft" @patch="patch" />
        <QuotationItemsTable
          v-model="draft.items"
          :totals="totals.lines"
          :errors="errors"
          :before-tax="draft.priceMode === 'exclusive'"
          show-withholding-amount
          @add="addLine"
          @remove="removeLine"
        />
        <div class="document-bottom">
          <div>
            <label class="mb-5 flex items-center gap-2 text-sm">
              <input v-model="draft.signatureEnabled" type="checkbox" class="accent-sky-500" />
              แสดงช่องลายเซ็นและตรายาง
            </label>
            <QuotationNotesSection
              v-model:note="draft.note"
              v-model:internal-note="draft.internalNote"
            />
            <BillingAttachments v-model="draft.attachments" @busy="uploading = $event" />
          </div>
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
    <QuotationPrintPreview
      :draft="draft"
      :number="number"
      :totals="totals"
      title="ใบวางบิล"
      :signature-enabled="draft.signatureEnabled"
    />
    <Teleport to="body">
      <AppDialog v-if="modal === 'share'" title="แชร์ใบวางบิล" @close="modal = null">
        <label class="form-field">
          <span class="field-label">ข้อความสำหรับส่งให้ลูกค้า</span>
          <textarea class="form-input" :value="shareText" rows="7" readonly />
        </label>
        <p v-if="message" role="status" class="mt-3">{{ message }}</p>
        <template #actions>
          <button class="button button-white" @click="modal = null">ปิด</button>
          <button class="button button-blue" @click="copySummary">คัดลอกข้อความ</button>
        </template>
      </AppDialog>
      <AppDialog v-if="modal === 'info'" title="ข้อมูลใบวางบิล" @close="modal = null">
        <p>{{ number }}</p>
        <p>
          {{
            updatedAt
              ? `บันทึกล่าสุด: ${new Date(updatedAt).toLocaleString('th-TH')}`
              : 'ยังไม่ได้บันทึกเอกสาร'
          }}
        </p>
        <p v-if="dirty" class="mt-2 text-amber-700">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</p>
        <template #actions>
          <button class="button button-white" @click="modal = null">ปิด</button>
        </template>
      </AppDialog>
    </Teleport>
  </template>
</template>
