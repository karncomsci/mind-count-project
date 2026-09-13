import { expect, test } from '@playwright/test'

test('web shell and same-origin readiness proxy', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'ใบเสนอราคา', exact: true })).toBeVisible()
  const ready = await request.get('/api/health/ready')
  expect(ready.status()).toBe(200)
  expect(ready.headers()['x-request-id']).toBeTruthy()
  expect(await ready.json()).toEqual({ status: 'ok' })
})
