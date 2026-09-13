import type { SalesSort } from '../../../components/sales/table'
import type { QuotationRecord } from '../types'
import { calculateTotals } from './calculations'
import { statusLabels } from './status'

export function sortQuotations(records: QuotationRecord[], key: SalesSort, ascending: boolean) {
  function value(record: QuotationRecord): string | number {
    switch (key) {
      case 'date':
        return record.draft.date
      case 'number':
        return record.number
      case 'customer':
        return `${record.draft.customer.name} ${record.draft.project}`
      case 'due':
        return record.draft.creditMode === 'days' ? record.draft.dueDate : ''
      case 'total':
        return calculateTotals(record.draft).total
      case 'status':
        return statusLabels[record.status]
    }
  }
  return records
    .map((record) => ({ record, value: value(record) }))
    .toSorted((a, b) => {
      if (key === 'due' && (!a.value || !b.value)) return a.value === b.value ? 0 : a.value ? -1 : 1
      const compared =
        typeof a.value === 'number' && typeof b.value === 'number'
          ? a.value - b.value
          : String(a.value).localeCompare(String(b.value), 'th', { numeric: true })
      return (
        (ascending ? 1 : -1) * (compared || a.record.updatedAt.localeCompare(b.record.updatedAt))
      )
    })
    .map((item) => item.record)
}
