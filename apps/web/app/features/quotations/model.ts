// Public, framework-independent document primitives shared with billing notes.
export type { Customer, QuotationDraft, QuotationLine, QuotationTotals } from './types'
export { quotationSchema } from './schemas/quotation'
export { createDraft, createLine, sampleCustomers } from './services/fixtures'
export { calculateTotals } from './services/calculations'
export { formatMoney, formatDate, today } from './services/format'
