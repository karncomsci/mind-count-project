export type QuotationStatus = 'draft' | 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired'
export type PriceMode = 'exclusive' | 'inclusive'
export type CreditMode = 'days' | 'cash' | 'undated'

export interface Customer {
  name: string
  address: string
  postalCode: string
  taxId: string
  branch: string
}

export interface QuotationLine {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discountPercent: number
  vatRate: number
  withholdingRate: number
}

export interface QuotationDraft {
  customer: Customer
  date: string
  creditDays: number
  creditMode: CreditMode
  dueDate: string
  salesperson: string
  project: string
  reference: string
  description: string
  warehouse: string
  priceMode: PriceMode
  items: QuotationLine[]
  documentDiscount: number
  note: string
  internalNote: string
}

export interface QuotationRecord {
  id: string
  number: string
  status: QuotationStatus
  updatedAt: string
  draft: QuotationDraft
}

// All calculated money values are integer satang.
export interface LineTotals {
  gross: number
  discount: number
  net: number
  vat: number
  withholding: number
  total: number
}
export interface QuotationTotals {
  lines: LineTotals[]
  subtotal: number
  discount: number
  afterDiscount: number
  taxable: number
  exempt: number
  vat: number
  total: number
  withholding: number
  payable: number
}
