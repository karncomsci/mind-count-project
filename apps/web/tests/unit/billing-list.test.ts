import { describe, expect, it } from 'vitest'
import { billingRecordSchema, createBillingDraft } from '../../app/features/billing-notes/model'
import {
  filterBillingRecords,
  billingCsv,
  billingDateRange,
} from '../../app/features/billing-notes/services/list'

function record(id: string, date = '2026-09-13') {
  const draft = createBillingDraft(date)
  draft.customer.name = `ลูกค้า ${id}`
  draft.items[0] = { ...draft.items[0]!, description: 'คอม', unitPrice: 20000, withholdingRate: 3 }
  return billingRecordSchema.parse({
    id,
    number: `BL20260913${id.padStart(4, '0')}`,
    updatedAt: `${date}T00:00:00.000Z`,
    draft,
  })
}
describe('billing list', () => {
  it('reads legacy records with draft status and a standard billing kind', () => {
    expect(record('1')).toMatchObject({ status: 'draft', kind: 'billing', deletedAt: null })
  })
  it('filters deleted/type/status/date/description without changing the source order', () => {
    const one = record('1'),
      two = {
        ...record('2', '2026-09-12'),
        kind: 'consolidated' as const,
        status: 'billed' as const,
      }
    two.draft.description = 'งานพิเศษ'
    const deleted = { ...record('3'), deletedAt: '2026-09-13T00:00:00.000Z' }
    expect(
      filterBillingRecords(
        [one, two, deleted],
        {
          query: 'งานพิเศษ',
          kind: 'consolidated',
          status: 'billed',
          start: '2026-09-12',
          end: '2026-09-12',
        },
        'date',
        false,
      ).map((x) => x.id),
    ).toEqual(['2'])
    expect(
      filterBillingRecords([one, deleted], { status: 'deleted' }, 'date', false).map((x) => x.id),
    ).toEqual(['3'])
    const source = [one, two]
    expect(filterBillingRecords(source, {}, 'date', true).map((x) => x.id)).toEqual(['2', '1'])
    expect(source.map((x) => x.id)).toEqual(['1', '2'])
  })
  it('exports VAT-inclusive total rather than withholding-adjusted payable and escapes spreadsheet formula input', () => {
    const item = record('1')
    item.draft.customer.name = '=FORMULA()'
    item.draft.internalNote = 'private-note'
    const csv = billingCsv([item])
    expect(csv).toContain('21400.00')
    expect(csv).not.toContain('20800.00')
    expect(csv).toContain("'=FORMULA()")
    expect(csv).not.toContain('private-note')
  })
  it('handles previous-month year boundaries, leap years, and fiscal years', () => {
    expect(billingDateRange('previous-month', '2026-01-12')).toEqual({
      start: '2025-12-01',
      end: '2025-12-31',
    })
    expect(billingDateRange('month', '2024-02-12')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    })
    expect(billingDateRange('fiscal', '2026-09-13', 2025, 10)).toEqual({
      start: '2025-10-01',
      end: '2026-09-30',
    })
    expect(billingDateRange('all', '2026-09-13')).toEqual({ start: '', end: '' })
  })
})
