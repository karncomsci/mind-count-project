import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  billingDraftSchema,
  nextBillingNumber,
  projectSchema,
  warehouseSchema,
  type BillingDraft,
  type BillingProject,
  type BillingWarehouse,
} from '../model'
import {
  initialBillingState,
  loadBillingState,
  saveBillingState,
  type BillingState,
} from '../services/storage'

export const useBillingNotesStore = defineStore('billing-notes', () => {
  const state = ref(initialBillingState())
  const ready = ref(false)
  const warning = ref('')
  function hydrate() {
    try {
      state.value = loadBillingState(window.localStorage)
      warning.value = ''
    } catch {
      warning.value =
        'อ่านข้อมูลใบวางบิลไม่ได้ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์ ข้อมูลเดิมจะไม่ถูกเขียนทับ'
    }
    ready.value = true
  }
  function latest() {
    if (warning.value) throw new Error(warning.value)
    return loadBillingState(window.localStorage)
  }
  function commit(next: BillingState) {
    saveBillingState(window.localStorage, next)
    state.value = next
  }
  function save(draft: BillingDraft, id?: string) {
    const next = latest()
    const parsed = billingDraftSchema.parse(draft)
    const existing = next.records.find((record) => record.id === id)
    if (id && !existing) throw new Error('ไม่พบใบวางบิลนี้')
    const record = {
      id: existing?.id ?? crypto.randomUUID(),
      number:
        existing?.number ??
        nextBillingNumber(
          parsed.date,
          next.records.map((item) => item.number),
        ),
      updatedAt: new Date().toISOString(),
      draft: parsed,
    }
    next.records = existing
      ? next.records.map((item) => (item.id === id ? record : item))
      : [record, ...next.records]
    commit(next)
    return record
  }
  function addProject(project: BillingProject) {
    const next = latest()
    const parsed = projectSchema.parse(project)
    if (
      next.projects.some(
        (item) => item.name.toLocaleLowerCase() === parsed.name.toLocaleLowerCase(),
      )
    )
      throw new Error('มีชื่อโปรเจ็คนี้แล้ว')
    next.projects.push(parsed)
    commit(next)
    return parsed
  }
  function addWarehouse(warehouse: BillingWarehouse) {
    const next = latest()
    const parsed = warehouseSchema.parse(warehouse)
    if (
      next.warehouses.some(
        (item) =>
          item.name.toLocaleLowerCase() === parsed.name.toLocaleLowerCase() ||
          (parsed.code && item.code.toLocaleLowerCase() === parsed.code.toLocaleLowerCase()),
      )
    )
      throw new Error('ชื่อหรือรหัสคลังสินค้านี้มีอยู่แล้ว')
    next.warehouses.push(parsed)
    commit(next)
    return parsed
  }
  return { state, ready, warning, hydrate, save, addProject, addWarehouse }
})
