import type { BillingRecord } from '../model'
import { calculateTotals } from '../../quotations/model'
import { billingStatusLabels } from './status'
export { documentDateRange as billingDateRange } from '../../../components/sales/search'
export type { SalesPeriod as BillingPeriod } from '../../../components/sales/search'

export type BillingSort = 'date' | 'number' | 'customer' | 'due' | 'total' | 'status'
export interface BillingFilters {
  query?: string
  kind?: 'all' | BillingRecord['kind']
  status?: string
  start?: string
  end?: string
}
export function filterBillingRecords(
  records: BillingRecord[],
  filters: BillingFilters,
  sort: BillingSort,
  ascending: boolean,
): BillingRecord[] {
  const query = filters.query?.trim().toLocaleLowerCase('th') ?? ''
  const filtered = records.filter((record) => {
    const { draft } = record
    return (
      (filters.status === 'deleted' ? !!record.deletedAt : !record.deletedAt) &&
      (!filters.kind || filters.kind === 'all' || record.kind === filters.kind) &&
      (!filters.status ||
        ['all', 'deleted'].includes(filters.status) ||
        record.status === filters.status) &&
      (!filters.start || draft.date >= filters.start) &&
      (!filters.end || draft.date <= filters.end) &&
      `${record.number} ${draft.customer.name} ${draft.project} ${draft.description} ${draft.items.map((item) => item.description).join(' ')}`
        .toLocaleLowerCase('th')
        .includes(query)
    )
  })
  const value = (record: BillingRecord): string | number => {
    switch (sort) {
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
        return billingStatusLabels[record.status]
    }
  }
  return filtered
    .map((record) => ({ record, value: value(record) }))
    .toSorted((a, b) => {
      if (sort === 'due' && (!a.value || !b.value))
        return a.value === b.value ? 0 : a.value ? -1 : 1
      const compared =
        typeof a.value === 'number' && typeof b.value === 'number'
          ? a.value - b.value
          : String(a.value).localeCompare(String(b.value), 'th', { numeric: true })
      return (ascending ? 1 : -1) * compared || a.record.number.localeCompare(b.record.number)
    })
    .map((item) => item.record)
}
export function billingCsv(records: BillingRecord[]): string {
  const escape = (value: string) =>
    `"${(/^\s*[=+@-]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`
  const rows = [
    [
      'วันที่',
      'เลขที่เอกสาร',
      'ชื่อลูกค้า',
      'ชื่อโปรเจ็ค',
      'วันครบกำหนด',
      'ยอดรวมสุทธิ',
      'สกุลเงิน',
      'สถานะ',
      'ประเภท',
    ],
    ...records.map(({ draft, ...record }) => [
      draft.date,
      record.number,
      draft.customer.name,
      draft.project,
      draft.creditMode === 'days' ? draft.dueDate : '',
      (calculateTotals(draft).total / 100).toFixed(2),
      'THB',
      record.deletedAt ? 'เอกสารที่ถูกลบ' : billingStatusLabels[record.status],
      record.kind === 'billing' ? 'ใบวางบิล' : 'ใบวางบิลรวม',
    ]),
  ]
  return '\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\r\n')
}
