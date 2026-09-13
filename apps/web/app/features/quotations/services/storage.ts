import { recordsSchema } from '../schemas/quotation'
import type { QuotationRecord } from '../types'

export const STORAGE_KEY = 'mind-count:quotations:demo:v1'
export function loadQuotations(storage: Pick<Storage, 'getItem'>): QuotationRecord[] | null {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return null
  return recordsSchema.parse(JSON.parse(raw))
}
export function saveQuotations(
  storage: Pick<Storage, 'setItem'>,
  records: QuotationRecord[],
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(recordsSchema.parse(records)))
}
