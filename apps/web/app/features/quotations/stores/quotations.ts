import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sampleQuotations } from '../services/fixtures'
import { loadQuotations, saveQuotations } from '../services/storage'
import { nextDocumentNumber } from '../services/format'
import { quotationSchema } from '../schemas/quotation'
import type { QuotationDraft, QuotationRecord, QuotationStatus } from '../types'

export const useQuotationsStore = defineStore('quotations', () => {
  const records = ref(sampleQuotations())
  const hydrated = ref(false)
  const storageWarning = ref('')
  // Called only after mount: browser data never participates in server rendering.
  function hydrate() {
    if (hydrated.value) return
    try {
      records.value = loadQuotations(window.localStorage) ?? sampleQuotations()
    } catch {
      storageWarning.value =
        'อ่านข้อมูลที่บันทึกไว้ไม่ได้ กำลังแสดงข้อมูลตัวอย่าง กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์'
    }
    hydrated.value = true
  }
  function save(draft: QuotationDraft, id?: string): QuotationRecord {
    if (storageWarning.value) throw new Error('Cannot overwrite unreadable browser data')
    const validated = quotationSchema.parse(draft)
    const existing = records.value.find((record) => record.id === id)
    if (id && !existing) throw new Error('ไม่พบเอกสารที่ต้องการแก้ไข')
    const record: QuotationRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      number:
        existing?.number ??
        nextDocumentNumber(
          validated.date,
          records.value.map((record) => record.number),
        ),
      status: existing?.status ?? 'draft',
      updatedAt: new Date().toISOString(),
      draft: validated,
    }
    const next = existing
      ? records.value.map((item) => (item.id === record.id ? record : item))
      : [record, ...records.value]
    // Persist before updating state, so a storage failure cannot appear as a successful save.
    commit(next)
    return record
  }
  function commit(next: QuotationRecord[]) {
    if (storageWarning.value) throw new Error('Cannot overwrite unreadable browser data')
    saveQuotations(window.localStorage, next)
    records.value = next
  }
  function requireRecord(id: string) {
    const record = records.value.find((item) => item.id === id)
    if (!record) throw new Error('ไม่พบเอกสาร')
    return record
  }
  function setStatus(id: string, status: QuotationStatus) {
    const record = requireRecord(id)
    commit(
      records.value.map((item) =>
        item.id === id ? { ...record, status, updatedAt: new Date().toISOString() } : item,
      ),
    )
  }
  function remove(id: string) {
    requireRecord(id)
    commit(records.value.filter((item) => item.id !== id))
  }
  function duplicate(id: string) {
    const draft = quotationSchema.parse(JSON.parse(JSON.stringify(requireRecord(id).draft)))
    return save(draft)
  }
  return { records, hydrated, storageWarning, hydrate, save, setStatus, remove, duplicate }
})
