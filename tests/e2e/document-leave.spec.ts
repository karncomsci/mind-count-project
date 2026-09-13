import { mockBilling } from './support/billing-api'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => { await mockBilling(page) })

for (const kind of ['quotations', 'billing-notes']) {
  test(`${kind}: cancel, Escape and discard changes through the app dialog`, async ({ page }) => {
    page.on('dialog', (dialog) => dialog.dismiss())
    await page.goto(`/sales/${kind}/new`)
    await expect(page.getByRole('button', { name: 'บันทึกเอกสาร', exact: true })).toBeEnabled()
    await page.getByLabel('ชื่อลูกค้า', { exact: false }).fill('ยังไม่บันทึก')
    await page.getByRole('link', { name: 'ปิดหน้าต่าง', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'คุณต้องการบันทึกข้อมูลหรือไม่', exact: true })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'ยกเลิก', exact: true }).click()
    await expect(page.getByLabel('ชื่อลูกค้า', { exact: false })).toHaveValue('ยังไม่บันทึก')
    await page.getByRole('link', { name: 'ปิดหน้าต่าง', exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await page.getByRole('link', { name: 'ปิดหน้าต่าง', exact: true }).click()
    await dialog.getByRole('button', { name: 'ไม่บันทึกและปิด', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/sales/${kind}$`))
    expect(
      await page.evaluate((key) => localStorage.getItem(key), `mind-count:${kind}:demo:v1`),
    ).toBeNull()
  })
  test(`${kind}: save and close validates before leaving and persists valid data`, async ({
    page,
  }) => {
    await page.goto(`/sales/${kind}/new`)
    await expect(page.getByRole('button', { name: 'บันทึกเอกสาร', exact: true })).toBeEnabled()
    await page.getByLabel('ชื่อลูกค้า', { exact: false }).fill('บันทึกก่อนปิด')
    await page.getByRole('link', { name: 'ปิดหน้าต่าง', exact: true }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'บันทึกและปิด', exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`/sales/${kind}/new$`))
    await expect(page.getByRole('alert')).toContainText('กรุณาระบุชื่อสินค้า')
    await page.getByLabel('ชื่อสินค้า รายการที่ 1', { exact: true }).fill('สินค้า')
    await page.getByRole('link', { name: 'ปิดหน้าต่าง', exact: true }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'บันทึกและปิด', exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`/sales/${kind}$`))
    await expect(page.locator('tbody tr').filter({ hasText: 'บันทึกก่อนปิด' })).toHaveCount(1)
  })
}
