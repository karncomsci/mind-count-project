import type { Page } from '@playwright/test'
import { billingRecordSchema, nextBillingNumber } from '../../../apps/web/app/features/billing-notes/model'
import { initialBillingState, type BillingState } from '../../../apps/web/app/features/billing-notes/services/storage'

// Browser interaction tests use an isolated contract fixture. PostgreSQL behavior is tested separately.
export async function mockBilling(page: Page, state: BillingState = initialBillingState()) {
  await page.route('**/api/v1/billing', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: state })
    const body = route.request().postDataJSON()
    if (body.operation === 'project' || body.operation === 'warehouse') {
      const key = body.operation === 'project' ? 'projects' : 'warehouses'
      const item = body[body.operation]
      state[key] = [...state[key].filter(entry => entry.id !== item.id), item]
      return route.fulfill({ json: { [body.operation]: item } })
    }
    let record = state.records.find(item => item.id === (body.id ?? body.record?.id))
    if (record && body.operation !== 'import' && record.version !== body.version) return route.fulfill({ status: 409, json: { error: { code: 'version_conflict', message: 'ข้อมูลมีการเปลี่ยนแปลงจากหน้าต่างอื่น', details: {}, requestId: 'fixture' } } })
    if (!record) record = billingRecordSchema.parse(body.record ?? { id: crypto.randomUUID(), number: nextBillingNumber(body.draft.date, state.records.map(item => item.number)), updatedAt: new Date().toISOString(), draft: body.draft })
    if (body.operation === 'save') record.draft = body.draft
    if (body.operation === 'status') record.status = body.status
    if (body.operation === 'delete') record.deletedAt = new Date().toISOString()
    if (body.operation === 'restore') record.deletedAt = null
    record.version++
    record.updatedAt = new Date().toISOString()
    state.records = [record, ...state.records.filter(item => item.id !== record!.id)]
    return route.fulfill({ json: { record } })
  })
  return state
}
