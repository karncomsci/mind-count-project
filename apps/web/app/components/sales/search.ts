export interface SalesFilters {
  query?: string
  status?: string
  start?: string
  end?: string
}
export function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export type SalesPeriod =
  'all' | 'month' | 'previous-month' | 'custom' | 'year' | 'previous-year' | 'fiscal'
export function documentDateRange(
  period: SalesPeriod,
  today: string,
  fiscalYear = Number(today.slice(0, 4)),
  startMonth = 1,
): { start: string; end: string } {
  if (period === 'all' || period === 'custom') return { start: '', end: '' }
  const year = Number(today.slice(0, 4)),
    month = Number(today.slice(5, 7)) - 1
  let start: Date, end: Date
  if (period === 'month' || period === 'previous-month') {
    const selected = month - (period === 'previous-month' ? 1 : 0)
    start = new Date(Date.UTC(year, selected, 1))
    end = new Date(Date.UTC(year, selected + 1, 0))
  } else if (period === 'fiscal') {
    start = new Date(Date.UTC(fiscalYear, startMonth - 1, 1))
    end = new Date(Date.UTC(fiscalYear + 1, startMonth - 1, 0))
  } else {
    const selected = year - (period === 'previous-year' ? 1 : 0)
    start = new Date(Date.UTC(selected, 0, 1))
    end = new Date(Date.UTC(selected, 11, 31))
  }
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}
