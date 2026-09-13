import { useQuotationsStore } from '../stores/quotations'
import { createQuotationPdf, downloadPdf, pdfFilename } from '../services/pdf'
import type { QuotationAction } from '../services/actions'
import type { QuotationRecord, QuotationStatus } from '../types'

export function useQuotationActions() {
  const store = useQuotationsStore()
  const busy = ref(false)
  const message = ref('')
  const actionError = ref('')
  const deleteTarget = ref<QuotationRecord | null>(null)
  const shareTarget = ref<QuotationRecord | null>(null)
  const printRecords = ref<QuotationRecord[]>([])
  const printMode = ref<'document' | 'envelope'>('document')
  async function run(operation: () => void | Promise<void>) {
    if (busy.value) return
    busy.value = true
    actionError.value = ''
    message.value = ''
    try {
      await operation()
    } catch {
      actionError.value = 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่และตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์'
    } finally {
      busy.value = false
    }
  }
  function status(record: QuotationRecord, value: QuotationStatus) {
    return run(() => {
      store.setStatus(record.id, value)
      message.value = `เปลี่ยนสถานะ ${record.number} แล้ว`
    })
  }
  function download(records: QuotationRecord[]) {
    return run(async () => {
      if (!records.length) return
      const blob = await createQuotationPdf(records)
      downloadPdf(blob, pdfFilename(records))
      message.value = 'ดาวน์โหลด PDF แล้ว'
    })
  }
  function print(records: QuotationRecord[], mode: 'document' | 'envelope' = 'document') {
    return run(async () => {
      if (!records.length) return
      printRecords.value = records
      printMode.value = mode
      await nextTick()
      window.print()
    })
  }
  function confirmDelete() {
    return run(() => {
      if (!deleteTarget.value) return
      store.remove(deleteTarget.value.id)
      message.value = `ลบ ${deleteTarget.value.number} แล้ว`
      deleteTarget.value = null
    })
  }
  function action(record: QuotationRecord, value: QuotationAction) {
    if (busy.value) return
    if (value === 'edit') return navigateTo(`/sales/quotations/${record.id}`)
    if (value === 'download') return download([record])
    if (value === 'print' || value === 'envelope')
      return print([record], value === 'envelope' ? 'envelope' : 'document')
    if (value === 'share') {
      shareTarget.value = record
      return
    }
    if (value === 'delete') {
      deleteTarget.value = record
      return
    }
    return run(async () => {
      const copy = store.duplicate(record.id)
      await navigateTo(`/sales/quotations/${copy.id}`)
    })
  }
  return {
    busy,
    message,
    actionError,
    deleteTarget,
    shareTarget,
    printRecords,
    printMode,
    status,
    download,
    print,
    confirmDelete,
    action,
  }
}
