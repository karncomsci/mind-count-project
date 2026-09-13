import { describe, expect, it } from 'vitest'
import { calculateTotals } from '../../app/features/quotations/services/calculations'
import { quotationSchema } from '../../app/features/quotations/schemas/quotation'
import { createDraft, createLine } from '../../app/features/quotations/services/fixtures'
import { addDays, nextDocumentNumber } from '../../app/features/quotations/services/format'

describe('quotation calculation in satang', () => {
  it('applies line discount then document discount, VAT and withholding', () => {
    const draft = createDraft('2026-09-13')
    draft.items = [
      {
        ...createLine('one'),
        description: 'บริการ',
        quantity: 2,
        unitPrice: 1000,
        discountPercent: 10,
        vatRate: 7,
        withholdingRate: 3,
      },
    ]
    draft.documentDiscount = 100
    expect(calculateTotals(draft)).toMatchObject({
      subtotal: 200000,
      discount: 30000,
      taxable: 170000,
      vat: 11900,
      total: 181900,
      withholding: 5100,
      payable: 176800,
    })
  })
  it('extracts VAT from inclusive prices and leaves exempt lines untaxed', () => {
    const draft = createDraft('2026-09-13')
    draft.priceMode = 'inclusive'
    draft.items = [
      { ...createLine('one'), quantity: 1, unitPrice: 107, vatRate: 7 },
      { ...createLine('two'), quantity: 1, unitPrice: 50, vatRate: 0 },
    ]
    expect(calculateTotals(draft)).toMatchObject({
      taxable: 10000,
      exempt: 5000,
      vat: 700,
      total: 15700,
    })
  })
  it('keeps fractional prices and allocated discounts exact to satang', () => {
    const draft = createDraft('2026-09-13')
    draft.items = [
      { ...createLine('one'), quantity: 3, unitPrice: 0.1, vatRate: 0 },
      { ...createLine('two'), quantity: 1, unitPrice: 0.3, vatRate: 0 },
    ]
    draft.documentDiscount = 0.01
    const totals = calculateTotals(draft)
    expect(totals.subtotal).toBe(60)
    expect(totals.total).toBe(59)
    expect(totals.lines.reduce((sum, line) => sum + line.net, 0)).toBe(59)
  })
})

describe('quotation validation and dates', () => {
  it('requires customer and at least one described item', () => {
    expect(quotationSchema.safeParse(createDraft('2026-09-13')).success).toBe(false)
  })
  it('rejects invalid dates, negative quantities and excessive discounts', () => {
    const draft = createDraft('2026-09-13')
    draft.customer.name = 'บริษัท ตัวอย่าง'
    draft.items[0]!.description = 'สินค้า'
    draft.items[0]!.unitPrice = 100
    expect(quotationSchema.safeParse(draft).success).toBe(true)
    expect(quotationSchema.safeParse({ ...draft, date: '2026-02-30' }).success).toBe(false)
    expect(quotationSchema.safeParse({ ...draft, documentDiscount: 101 }).success).toBe(false)
    expect(
      quotationSchema.safeParse({ ...draft, items: [{ ...draft.items[0], quantity: -1 }] }).success,
    ).toBe(false)
  })
  it('handles month boundaries and generates document numbers without collisions', () => {
    expect(addDays('2026-01-31', 30)).toBe('2026-03-02')
    expect(nextDocumentNumber('2026-09-13', ['QT202609130001', 'QT202609130003'])).toBe(
      'QT202609130004',
    )
  })
})
