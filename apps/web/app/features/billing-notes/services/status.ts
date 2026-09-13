export const billingStatuses = ['draft', 'waiting', 'billed', 'cancelled'] as const
export type BillingStatus = (typeof billingStatuses)[number]
export const billingStatusLabels: Record<BillingStatus, string> = {
  draft: 'ร่าง',
  waiting: 'รอวางบิล',
  billed: 'วางบิลแล้ว',
  cancelled: 'ยกเลิก',
}
export const billingStatusClasses: Record<BillingStatus, string> = {
  draft: 'status-draft',
  waiting: 'status-pending',
  billed: 'status-sent',
  cancelled: 'status-rejected',
}
export function isBillingStatus(value: string): value is BillingStatus {
  return billingStatuses.some((status) => status === value)
}
