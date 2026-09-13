import type { QuotationStatus } from '../types'

export const quotationStatuses = [
  'draft',
  'pending',
  'sent',
  'accepted',
  'rejected',
  'expired',
] as const
export const statusLabels: Record<QuotationStatus, string> = {
  draft: 'ร่าง',
  pending: 'รออนุมัติ',
  sent: 'ส่งแล้ว',
  accepted: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
  expired: 'หมดอายุ',
}
export function isQuotationStatus(value: string): value is QuotationStatus {
  return quotationStatuses.some((status) => status === value)
}
