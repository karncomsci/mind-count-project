<script setup lang="ts">
import AppDialog from '~/components/base/AppDialog.vue'
import { createQuotationPdf, downloadPdf, pdfFilename } from '../services/pdf'
import type { QuotationRecord } from '../types'
const props = defineProps<{ record: QuotationRecord }>()
defineEmits<{ close: [] }>()
const file = shallowRef<File | null>(null)
const error = ref('')
const sharing = ref(false)
const canShare = ref(false)
onMounted(async () => {
  try {
    const blob = await createQuotationPdf([props.record])
    file.value = new File([blob], pdfFilename([props.record]), { type: 'application/pdf' })
    canShare.value = !!navigator.canShare?.({ files: [file.value] })
  } catch {
    error.value = 'สร้าง PDF ไม่สำเร็จ กรุณาปิดหน้าต่างแล้วลองใหม่'
  }
})
async function share() {
  if (!file.value || sharing.value) return
  sharing.value = true
  try {
    await navigator.share({ files: [file.value], title: props.record.number })
  } catch (cause) {
    if (!(cause instanceof DOMException && cause.name === 'AbortError'))
      error.value = 'แชร์ไม่สำเร็จ สามารถดาวน์โหลด PDF แล้วส่งต่อได้'
  } finally {
    sharing.value = false
  }
}
function download() {
  if (file.value) downloadPdf(file.value, file.value.name)
}
</script>
<template>
  <AppDialog :title="`แชร์ใบเสนอราคา ${record.number}`" @close="$emit('close')">
    <p>ส่งต่อเอกสารให้ลูกค้าเป็นไฟล์ PDF</p>
    <p v-if="!file && !error" role="status" class="mt-3">กำลังเตรียมไฟล์…</p>
    <p v-else-if="file && !canShare" class="mt-3">
      เบราว์เซอร์นี้ไม่รองรับการแชร์ไฟล์โดยตรง ดาวน์โหลด PDF แล้วแนบในแอปที่ต้องการได้
    </p>
    <p v-if="error" role="alert" class="mt-3 text-rose-600">{{ error }}</p>
    <template #actions>
      <button type="button" class="button button-white" @click="$emit('close')">ปิด</button>
      <button type="button" class="button button-outline-blue" :disabled="!file" @click="download">
        ดาวน์โหลด PDF เพื่อส่งต่อ
      </button>
      <button
        v-if="canShare"
        type="button"
        class="button button-blue"
        :disabled="sharing"
        @click="share"
      >
        แชร์ไฟล์ PDF
      </button>
    </template>
  </AppDialog>
</template>
