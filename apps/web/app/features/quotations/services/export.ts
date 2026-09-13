import { calculateTotals } from './calculations'
import type { QuotationRecord } from '../types'

export function quotationCsv(records: QuotationRecord[]): string {
  const escape = (value: string) => {
    const safe = /^\s*[=+@-]/.test(value) ? `'${value}` : value
    return `"${safe.replaceAll('"', '""')}"`
  }
  const rows = [
    ['วันที่', 'เลขที่เอกสาร', 'ชื่อลูกค้า', 'ยอดรวมสุทธิ', 'สถานะ'],
    ...records.map((record) => [
      record.draft.date,
      record.number,
      record.draft.customer.name,
      (calculateTotals(record.draft).total / 100).toFixed(2),
      record.status,
    ]),
  ]
  return '\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\r\n')
}

export function downloadQuotationCsv(records: QuotationRecord[]): void {
  const url = URL.createObjectURL(
    new Blob([quotationCsv(records)], { type: 'text/csv;charset=utf-8' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'quotations.csv'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
