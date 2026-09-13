import { createApiClient } from '../../../lib/api/client'
import type { components } from '../../../lib/api/generated/schema'
export type BillingCommand = components['schemas']['BillingCommand']
const unavailable = 'เชื่อมต่อบริการใบวางบิลไม่ได้ กรุณาลองใหม่'
export async function readBilling() {
  const { data, error } = await createApiClient().GET('/api/v1/billing')
  if (error || !data) throw new Error(error?.error.message ?? unavailable)
  return data
}
export async function mutateBilling(body: BillingCommand) {
  const { data, error } = await createApiClient().POST('/api/v1/billing', { body })
  if (error || !data) throw new Error(error?.error.message ?? unavailable)
  return data
}
