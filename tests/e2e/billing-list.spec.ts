import { mockBilling } from './support/billing-api'
import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createBillingDraft, billingRecordSchema } from '../../apps/web/app/features/billing-notes/model'
import { initialBillingState } from '../../apps/web/app/features/billing-notes/services/storage'

test.beforeEach(async ({ page }) => {
  const state = initialBillingState()
  for (let i = 1; i <= 14; i++) {
    const draft = createBillingDraft(`2026-09-${String(i).padStart(2, '0')}`)
    draft.customer.name = `ลูกค้าทดสอบ ${i}`
    draft.project = `โปรเจ็ค ${i}`
    draft.description = i === 2 ? 'งานค้นหาพิเศษ' : ''
    draft.items[0] = { ...draft.items[0]!, description: 'สินค้า', unitPrice: 20000, withholdingRate: 3 }
    state.records.push(billingRecordSchema.parse({ id: `bill-${i}`, number: `BL20260913${String(i).padStart(4, '0')}`, updatedAt: '2026-09-13T00:00:00.000Z', draft, kind: i === 13 ? 'consolidated' : 'billing', status: i === 2 ? 'billed' : 'waiting', deletedAt: i === 14 ? '2026-09-13T00:00:00.000Z' : null }))
  }
  await mockBilling(page, state)
})

test('nine-column table supports type filters, sorting, pagination and selected CSV export', async ({ page }) => {
  await page.goto('/sales/billing-notes')
  await expect(page.locator('tbody tr')).toHaveCount(10)
  await expect(page.getByRole('columnheader')).toHaveCount(9)
  await expect(page.getByRole('columnheader', { name: 'ชื่อลูกค้า/ชื่อโปรเจ็ค' })).toBeVisible()
  await expect(page.getByTestId('billing-net-total').first()).toHaveText('21,400.00')
  await page.getByRole('group', { name: 'ประเภทเอกสาร' }).getByRole('button', { name: 'ใบวางบิลรวม', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody tr')).toContainText('BL202609130013')
  await page.getByRole('button', { name: 'แสดงทั้งหมด', exact: true }).click()
  await page.getByRole('button', { name: 'วันที่', exact: true }).click()
  await expect(page.locator('tbody tr').first()).toContainText('BL202609130001')
  await page.getByRole('checkbox', { name: 'เลือกทั้งหมดในหน้านี้', exact: true }).check()
  await expect(page.getByText('เลือก 10 รายการ', { exact: false })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'ส่งออก CSV ที่เลือก' }).click()
  const download = await downloadPromise
  const csv = await readFile((await download.path())!, 'utf8')
  expect(csv.split('\r\n')).toHaveLength(11)
  expect(csv).toContain('21400.00')
  expect(csv).not.toContain('BL202609130013')
  await page.getByRole('button', { name: 'ยกเลิกการเลือกทั้งหมด' }).click()
  await page.getByRole('button', { name: 'หน้าถัดไป' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(3)
  await page.screenshot({ path: '_wrx-output/evidence/billing-notes-table/list-desktop.png', fullPage: true })
})

test('advanced search filters description, date range and exact billing status', async ({ page }) => {
  await page.goto('/sales/billing-notes')
  await expect(page.locator('tbody tr')).toHaveCount(10)
  await page.getByRole('button', { name: 'เปิดค้นหาใบวางบิล' }).click()
  const search = page.getByRole('dialog', { name: 'ค้นหาใบวางบิล', exact: true })
  await search.getByLabel('ค้นหาใบวางบิล', { exact: true }).fill('งานค้นหาพิเศษ')
  await search.getByRole('button', { name: 'ค้นหาเพิ่มเติม' }).click()
  await search.getByLabel('ช่วงเวลา').selectOption('custom')
  await search.getByLabel('วันที่เริ่มต้น').fill('2026-09-01')
  await search.getByLabel('วันที่สิ้นสุด').fill('2026-09-03')
  await search.getByLabel('สถานะเอกสาร').selectOption('billed')
  await page.screenshot({ path: '_wrx-output/evidence/billing-notes-table/search-desktop.png' })
  await search.getByRole('button', { name: 'ค้นหา', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody tr')).toContainText('BL202609130002')
})

test('status changes and soft delete/restore persist without losing the document', async ({ page }) => {
  await page.goto('/sales/billing-notes')
  await expect(page.locator('tbody tr')).toHaveCount(10)
  await page.getByRole('button', { name: 'เปลี่ยนสถานะ BL202609130012' }).click()
  await page.getByRole('button', { name: 'วางบิลแล้ว', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'เปลี่ยนสถานะ BL202609130012' })).toContainText('วางบิลแล้ว')
  await page.getByRole('button', { name: 'เมนู BL202609130012' }).click()
  await page.getByRole('button', { name: 'ลบ', exact: true }).click()
  await page.getByRole('dialog', { name: 'ลบใบวางบิล' }).getByRole('button', { name: 'ยืนยันลบ' }).click()
  await expect(page.getByRole('link', { name: 'BL202609130012' })).toHaveCount(0)
  await page.getByRole('button', { name: 'เปิดค้นหาใบวางบิล' }).click()
  const search = page.getByRole('dialog', { name: 'ค้นหาใบวางบิล', exact: true })
  await search.getByRole('button', { name: 'ค้นหาเพิ่มเติม' }).click()
  await search.getByLabel('สถานะเอกสาร').selectOption('deleted')
  await search.getByRole('button', { name: 'ค้นหา', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await page.getByRole('button', { name: 'เมนู BL202609130012' }).click()
  await page.getByRole('button', { name: 'กู้คืนเอกสาร', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await page.getByRole('button', { name: 'เปิดค้นหาใบวางบิล' }).click()
  await search.getByRole('button', { name: 'ล้างการค้นหา' }).click()
  await expect(page.getByRole('link', { name: 'BL202609130012' })).toBeVisible()
})

test('legacy import preserves its backup and uses server-backed records afterwards', async ({ page }) => {
  const state = initialBillingState()
  const draft = createBillingDraft('2026-09-13')
  draft.customer.name = 'ลูกค้าเดิม'
  draft.items[0]!.description = 'สินค้าเดิม'
  state.records.push(billingRecordSchema.parse({ id: 'legacy-browser', number: 'BL202609130099', updatedAt: '2026-09-13T00:00:00Z', draft }))
  await page.addInitScript(state => localStorage.setItem('mind-count:billing-notes:demo:v1', JSON.stringify(state)), state)
  await page.goto('/sales/billing-notes')
  await page.getByRole('button', { name: 'นำเข้าข้อมูลเดิม', exact: true }).click()
  await expect(page.getByRole('button', { name: 'นำเข้าข้อมูลเดิม', exact: true })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('mind-count:billing-notes:demo:v1'))).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('mind-count:billing-notes:demo:v1:backup'))).toContain('legacy-browser')
})
