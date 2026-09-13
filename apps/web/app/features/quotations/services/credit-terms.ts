import { addDays } from './format'
import type { QuotationDraft } from '../types'

export type CreditTerms = Pick<QuotationDraft, 'date' | 'creditMode' | 'creditDays' | 'dueDate'>

// Date-only UTC arithmetic keeps day counts independent of timezone and DST.
export function updateCreditTerms(current: CreditTerms, patch: Partial<CreditTerms>): CreditTerms {
  const next = { ...current, ...patch }
  if (next.creditMode === 'cash') {
    return { ...next, creditDays: 0, dueDate: next.date }
  }
  if (patch.dueDate !== undefined) {
    const difference =
      (Date.parse(`${next.dueDate}T00:00:00Z`) - Date.parse(`${next.date}T00:00:00Z`)) / 86_400_000
    if (Number.isFinite(difference)) next.creditDays = difference
  } else if (
    patch.date !== undefined ||
    patch.creditDays !== undefined ||
    patch.creditMode === 'days'
  ) {
    next.dueDate = addDays(next.date, next.creditDays)
  }
  return next
}
