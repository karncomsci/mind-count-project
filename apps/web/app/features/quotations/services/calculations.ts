import type { QuotationDraft, QuotationTotals } from '../types'

const cents = (value: number) => Math.round((Number(value) || 0) * 100)

export function calculateTotals(draft: QuotationDraft): QuotationTotals {
  const prepared = draft.items.map((item) => {
    const gross = Math.max(0, cents(item.quantity * item.unitPrice))
    const discount = Math.round(
      (gross * Math.min(100, Math.max(0, item.discountPercent || 0))) / 100,
    )
    return { item, gross, discount, discounted: gross - discount }
  })
  const discountedTotal = prepared.reduce((sum, line) => sum + line.discounted, 0)
  const documentDiscount = Math.min(discountedTotal, Math.max(0, cents(draft.documentDiscount)))
  let cumulative = 0
  let allocated = 0
  const lines = prepared.map(({ item, gross, discount, discounted }) => {
    cumulative += discounted
    const allocation = discountedTotal
      ? Math.round((documentDiscount * cumulative) / discountedTotal) - allocated
      : 0
    allocated += allocation
    const amount = discounted - allocation
    const net =
      draft.priceMode === 'inclusive' ? Math.round(amount / (1 + item.vatRate / 100)) : amount
    const vat =
      draft.priceMode === 'inclusive' ? amount - net : Math.round((net * item.vatRate) / 100)
    return {
      gross,
      discount: discount + allocation,
      net,
      vat,
      withholding: Math.round((net * item.withholdingRate) / 100),
      total: net + vat,
    }
  })
  const sum = (key: 'gross' | 'discount' | 'vat' | 'total' | 'withholding') =>
    lines.reduce((total, line) => total + line[key], 0)
  return {
    lines,
    subtotal: sum('gross'),
    discount: sum('discount'),
    afterDiscount: sum('gross') - sum('discount'),
    taxable: lines.reduce(
      (sum, line, index) => sum + (draft.items[index]!.vatRate > 0 ? line.net : 0),
      0,
    ),
    exempt: lines.reduce(
      (sum, line, index) => sum + (draft.items[index]!.vatRate === 0 ? line.net : 0),
      0,
    ),
    vat: sum('vat'),
    total: sum('total'),
    withholding: sum('withholding'),
    payable: sum('total') - sum('withholding'),
  }
}
