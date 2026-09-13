import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('billing editor creates catalogs, calculates, saves, and reloads independently', async ({
  page,
}) => {
  await page.goto('/sales/billing-notes')
  await page.getByRole('link', { name: 'สร้างใบวางบิล', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'สร้างใบวางบิล' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'บันทึกเอกสาร', exact: true })).toBeEnabled()
  await page.getByLabel('ชื่อลูกค้า', { exact: false }).fill('ลูกค้าทดสอบใบวางบิล')
  await page.getByLabel(/^วันที่/).fill('2026-09-13')
  await page.getByLabel('ชื่อสินค้า รายการที่ 1', { exact: true }).fill('คอม')
  await page.getByLabel('ราคาต่อหน่วย รายการที่ 1', { exact: true }).fill('20000')
  await page.getByLabel('หัก ณ ที่จ่าย รายการที่ 1', { exact: true }).selectOption('3')
  await expect(page.getByTestId('document-total')).toHaveText('21,400.00')
  await expect(page.getByTestId('payable-total')).toHaveText('20,800.00')
  await expect(page.locator('.items-table tbody tr').first()).toContainText('20,000.00')
  await expect(page.getByLabel('ครบกำหนด', { exact: true })).toHaveValue('2026-10-13')

  await page.getByRole('button', { name: 'เลือกโปรเจ็ค', exact: true }).click()
  await page.getByRole('button', { name: 'เพิ่มโปรเจ็ค', exact: true }).click()
  const project = page.getByRole('dialog', {
    name: 'สร้างโปรเจ็ค',
    exact: true,
  })
  await project.getByRole('button', { name: 'บันทึก', exact: true }).click()
  await expect(project.getByText('กรุณาระบุชื่อโปรเจ็ค', { exact: true })).toBeVisible()
  await project.getByLabel('ชื่อโปรเจ็ค', { exact: false }).fill('คอมพิวเตอร์ใหม่')
  await page.screenshot({
    path: '_wrx-output/evidence/billing-notes/project-dialog.png',
  })
  await project.getByRole('button', { name: 'บันทึก', exact: true }).click()
  await expect(project).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'เลือกโปรเจ็ค', exact: true })).toContainText(
    'คอมพิวเตอร์ใหม่',
  )

  await page.getByRole('button', { name: 'เลือกคลังสินค้า', exact: true }).click()
  await page.getByRole('button', { name: 'เพิ่มคลังสินค้า', exact: true }).click()
  const warehouse = page.getByRole('dialog', {
    name: 'สร้างคลังสินค้า',
    exact: true,
  })
  await warehouse.getByLabel('ชื่อคลังสินค้า', { exact: false }).fill('คลังกรุงเทพ')
  await warehouse.getByLabel('รหัสคลังสินค้า', { exact: true }).fill('BKK')
  await warehouse.getByLabel('จุดประสงค์การใช้งาน', { exact: false }).selectOption('ซื้อและขาย')
  await warehouse.getByLabel('อีเมล', { exact: true }).fill('warehouse@example.com')
  await page.screenshot({
    path: '_wrx-output/evidence/billing-notes/warehouse-dialog.png',
  })
  await warehouse.getByRole('button', { name: 'บันทึก', exact: true }).click()
  await expect(warehouse).toHaveCount(0)
  await page.getByLabel('โน้ตภายในบริษัท').fill('ข้อมูลภายในห้ามแสดงบนเอกสาร')
  await page.getByRole('button', { name: 'บันทึกเอกสาร', exact: true }).click()
  await expect(page).toHaveURL(/\/sales\/billing-notes\?saved=BL202609130001/)
  await page.getByRole('link', { name: 'BL202609130001', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'แก้ไขใบวางบิล', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'บันทึกเอกสาร', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'เลือกคลังสินค้า', exact: true })).toContainText(
    'คลังกรุงเทพ',
  )
  await expect(page.getByRole('button', { name: 'เลือกโปรเจ็ค', exact: true })).toContainText(
    'คอมพิวเตอร์ใหม่',
  )
  await expect(page.getByTestId('payable-total')).toHaveText('20,800.00')
  await page.screenshot({
    path: '_wrx-output/evidence/billing-notes/editor-desktop.png',
    fullPage: true,
  })
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-document')).toContainText('ใบวางบิล')
  await expect(page.locator('.print-document')).not.toContainText('ข้อมูลภายในห้ามแสดงบนเอกสาร')
  await expect(page.locator('.print-document')).toContainText('ผู้รับวางบิล / วันที่')
  await page.emulateMedia({ media: 'screen' })
  await page.getByLabel('โน้ตภายในบริษัท').fill('แก้ไขแล้ว')
  await page.getByRole('button', { name: 'บันทึกเอกสาร', exact: true }).click()
  await expect(page).toHaveURL(/\/sales\/billing-notes\?saved=/)
  await expect(page.locator('tbody tr')).toHaveCount(1)
  expect(
    await page.evaluate(() => localStorage.getItem('mind-count:quotations:demo:v1')),
  ).toBeNull()
})

test('attachments, PDF output and share summary preserve public/private boundaries', async ({
  page,
}) => {
  await page.goto('/sales/billing-notes/new')
  await expect(page.getByRole('button', { name: 'บันทึกเอกสาร', exact: true })).toBeEnabled()
  await page.getByLabel('ชื่อลูกค้า', { exact: false }).fill('ลูกค้าเอกสาร PDF')
  await page.getByLabel('ชื่อสินค้า รายการที่ 1', { exact: true }).fill('สินค้าทดสอบ')
  await page.getByLabel('ราคาต่อหน่วย รายการที่ 1', { exact: true }).fill('100')
  await page.getByLabel('โน้ตภายในบริษัท').fill('โน้ตลับภายใน')
  await page.getByLabel('แนบไฟล์', { exact: true }).setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=',
      'base64',
    ),
  })
  await expect(page.getByRole('link', { name: 'test.png' })).toBeVisible()
  await page.getByRole('button', { name: 'แชร์', exact: true }).click()
  const share = page.getByRole('dialog', { name: 'แชร์ใบวางบิล' })
  await expect(share.getByRole('textbox')).toHaveValue(/ใบวางบิล BL/)
  await expect(share.getByRole('textbox')).not.toHaveValue(/โน้ตลับภายใน/)
  await share.getByRole('button', { name: 'ปิด', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'ดาวน์โหลด', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^BL\d+\.pdf$/)
  const file = await download.path()
  expect((await readFile(file!)).subarray(0, 5).toString()).toBe('%PDF-')
  await download.saveAs('_wrx-output/evidence/billing-notes/billing-note.pdf')
  await page.getByRole('button', { name: 'บันทึกเอกสาร', exact: true }).click()
  await expect(page).toHaveURL(/\/sales\/billing-notes\?saved=/)
  await page.locator('a.document-link').click()
  await expect(page.getByRole('heading', { name: 'แก้ไขใบวางบิล' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'test.png' })).toBeVisible()
  await page.getByRole('button', { name: 'ลบไฟล์ test.png' }).click()
  await expect(page.getByRole('link', { name: 'test.png' })).toHaveCount(0)
  await page.getByLabel('แสดงช่องลายเซ็นและตรายาง').uncheck()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-document')).not.toContainText('ผู้รับวางบิล / วันที่')
})

test('mobile dialogs support keyboard cancellation and do not overflow the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/sales/billing-notes/new')
  await expect(page.getByRole('button', { name: 'บันทึกเอกสาร', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'เลือกโปรเจ็ค', exact: true }).click()
  await page.getByRole('button', { name: 'เพิ่มโปรเจ็ค', exact: true }).click()
  await page.getByRole('dialog').getByLabel('ชื่อโปรเจ็ค', { exact: false }).fill('ไม่บันทึก')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'เลือกโปรเจ็ค', exact: true })).toBeFocused()
  expect(
    await page.evaluate(() => localStorage.getItem('mind-count:billing-notes:demo:v1')),
  ).toBeNull()
  await page.getByRole('button', { name: 'เลือกคลังสินค้า', exact: true }).click()
  await page.getByRole('button', { name: 'เพิ่มคลังสินค้า', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.screenshot({
    path: '_wrx-output/evidence/billing-notes/warehouse-mobile.png',
  })
  await page.getByRole('dialog').getByRole('button', { name: 'ยกเลิก' }).click()
  const footer = await page.locator('.document-footer').boundingBox()
  const totals = await page.getByRole('region', { name: 'สรุปยอดเงิน' }).boundingBox()
  expect(footer!.y).toBeGreaterThanOrEqual(totals!.y + totals!.height)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({
    path: '_wrx-output/evidence/billing-notes/editor-mobile.png',
    fullPage: true,
  })
})

test('unreadable storage and missing records are explicit and never overwritten', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('mind-count:billing-notes:demo:v1', '{broken'),
  )
  await page.goto('/sales/billing-notes/new')
  await expect(page.getByRole('alert')).toContainText('อ่านข้อมูลใบวางบิลไม่ได้')
  await expect(page.getByRole('button', { name: 'บันทึกเอกสาร', exact: true })).toBeDisabled()
  expect(await page.evaluate(() => localStorage.getItem('mind-count:billing-notes:demo:v1'))).toBe(
    '{broken',
  )
})

test('unknown billing IDs show a useful not-found state', async ({ page }) => {
  await page.goto('/sales/billing-notes/missing-record')
  await expect(page.getByRole('heading', { name: 'ไม่พบใบวางบิลนี้' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'กลับไปรายการใบวางบิล' })).toHaveAttribute(
    'href',
    '/sales/billing-notes',
  )
})
