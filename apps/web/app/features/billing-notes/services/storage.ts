import { z } from 'zod'
import { billingRecordSchema, projectSchema, warehouseSchema } from '../model'

export const BILLING_STORAGE_KEY = 'mind-count:billing-notes:demo:v1'
export const stateSchema = z.object({
  records: z.array(billingRecordSchema),
  projects: z.array(projectSchema),
  warehouses: z.array(warehouseSchema),
})
export type BillingState = z.infer<typeof stateSchema>
export function initialBillingState(): BillingState {
  return {
    records: [],
    projects: [{ id: 'default-project', name: 'คอมพิวเตอร์', customer: '' }],
    warehouses: [
      {
        id: 'default-warehouse',
        name: 'คลังสินค้าหลัก',
        code: '',
        address: '',
        postalCode: '',
        purpose: 'ซื้อและขาย',
        contact: '',
        email: '',
        phone: '',
      },
    ],
  }
}
export function loadBillingState(storage: Pick<Storage, 'getItem'>): BillingState {
  const raw = storage.getItem(BILLING_STORAGE_KEY)
  return raw === null ? initialBillingState() : stateSchema.parse(JSON.parse(raw))
}
export function saveBillingState(storage: Pick<Storage, 'setItem'>, state: BillingState): void {
  storage.setItem(BILLING_STORAGE_KEY, JSON.stringify(stateSchema.parse(state)))
}
