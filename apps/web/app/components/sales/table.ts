export type SalesSort = 'date' | 'number' | 'customer' | 'due' | 'total' | 'status'
export interface SalesTableRow {
  id: string
  number: string
  date: string
  due: string
  customer: string
  project: string
  total: string
  href?: string
  deletedAt?: string | null
  label: string
}
