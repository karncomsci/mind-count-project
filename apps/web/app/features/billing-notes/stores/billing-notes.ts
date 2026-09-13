import { ZodError } from 'zod'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BillingStatus } from '../services/status'
import {
  billingDraftSchema,
  billingRecordSchema,
  projectSchema,
  warehouseSchema,
  type BillingDraft,
  type BillingProject,
  type BillingWarehouse,
} from '../model'
import {
  BILLING_STORAGE_KEY,
  initialBillingState,
  loadBillingState,
  stateSchema,
  type BillingState,
} from '../services/storage'
import { readBilling, mutateBilling, type BillingCommand } from '../services/api'

export const useBillingNotesStore = defineStore('billing-notes', () => {
  const state = ref(initialBillingState())
  const ready = ref(false)
  const warning = ref('')
  const legacy = ref<BillingState | null>(null)
  const legacyWarning = ref('')
  const importing = ref(false)
  let hydration: Promise<void> | undefined
  function hydrate() {
    if (hydration) return hydration
    hydration = (async () => {
      try {
        state.value = stateSchema.parse(await readBilling())
        warning.value = ''
      } catch (cause) {
        warning.value =
          cause instanceof Error && !(cause instanceof ZodError)
            ? cause.message
            : 'โหลดข้อมูลใบวางบิลไม่สำเร็จ'
      } finally {
        ready.value = true
      }
      try {
        if (window.localStorage.getItem(BILLING_STORAGE_KEY))
          legacy.value = loadBillingState(window.localStorage)
      } catch {
        legacyWarning.value = 'อ่านข้อมูลเดิมในเบราว์เซอร์ไม่ได้ ข้อมูลเดิมยังคงอยู่'
      }
    })().finally(() => {
      hydration = undefined
    })
    return hydration
  }
  async function command(body: BillingCommand) {
    if (warning.value) throw new Error(warning.value)
    const result = await mutateBilling(body)
    if (result.record) {
      const record = billingRecordSchema.parse(result.record)
      state.value.records = [record, ...state.value.records.filter((item) => item.id !== record.id)]
    }
    if (result.project) {
      const project = projectSchema.parse(result.project)
      state.value.projects = [
        ...state.value.projects.filter((item) => item.id !== project.id),
        project,
      ]
    }
    if (result.warehouse) {
      const warehouse = warehouseSchema.parse(result.warehouse)
      state.value.warehouses = [
        ...state.value.warehouses.filter((item) => item.id !== warehouse.id),
        warehouse,
      ]
    }
    return result
  }
  function version(id: string) {
    const record = state.value.records.find((item) => item.id === id)
    if (!record) throw new Error('ไม่พบเอกสาร')
    return record.version
  }
  async function save(draft: BillingDraft, id?: string, expectedVersion?: number) {
    const result = await command({
      operation: 'save',
      draft: billingDraftSchema.parse(draft),
      ...(id ? { id, version: expectedVersion ?? version(id) } : {}),
    })
    return billingRecordSchema.parse(result.record)
  }
  async function addProject(project: BillingProject) {
    const result = await command({ operation: 'project', project: projectSchema.parse(project) })
    return projectSchema.parse(result.project)
  }
  async function addWarehouse(warehouse: BillingWarehouse) {
    const result = await command({
      operation: 'warehouse',
      warehouse: warehouseSchema.parse(warehouse),
    })
    return warehouseSchema.parse(result.warehouse)
  }
  async function setStatus(id: string, status: BillingStatus) {
    await command({ operation: 'status', id, version: version(id), status })
  }
  async function setDeleted(id: string, deleted: boolean) {
    await command({ operation: deleted ? 'delete' : 'restore', id, version: version(id) })
  }
  async function duplicate(id: string) {
    const record = state.value.records.find((item) => item.id === id && !item.deletedAt)
    if (!record) throw new Error('ไม่พบเอกสารที่ใช้งานอยู่')
    return save(record.draft)
  }
  async function importLegacy() {
    if (!legacy.value || importing.value) return
    importing.value = true
    legacyWarning.value = ''
    try {
      const original = window.localStorage.getItem(BILLING_STORAGE_KEY)
      if (!original) {
        legacy.value = null
        return
      }
      const snapshot = loadBillingState({ getItem: () => original })
      for (const project of snapshot.projects) await addProject(project)
      for (const warehouse of snapshot.warehouses) await addWarehouse(warehouse)
      for (const record of snapshot.records) await command({ operation: 'import', record })
      // Keep the original browser payload as a recovery copy, and only mark it imported after every write succeeds.
      window.localStorage.setItem(`${BILLING_STORAGE_KEY}:backup`, original)
      if (window.localStorage.getItem(BILLING_STORAGE_KEY) !== original) {
        throw new Error(
          'ข้อมูลในเบราว์เซอร์เปลี่ยนระหว่างนำเข้า กรุณานำเข้าอีกครั้ง ข้อมูลต้นฉบับยังคงอยู่',
        )
      }
      window.localStorage.removeItem(BILLING_STORAGE_KEY)
      legacy.value = null
    } catch (cause) {
      legacyWarning.value =
        cause instanceof Error && !(cause instanceof ZodError)
          ? cause.message
          : 'นำเข้าไม่สำเร็จ ข้อมูลต้นฉบับยังคงอยู่'
    } finally {
      importing.value = false
    }
  }
  return {
    state,
    ready,
    warning,
    hydrate,
    save,
    addProject,
    addWarehouse,
    setStatus,
    setDeleted,
    duplicate,
    legacy,
    legacyWarning,
    importing,
    importLegacy,
  }
})
