import { describe, expect, it } from 'vitest'
import { updateCreditTerms } from '../../app/features/quotations/services/credit-terms'
import { sampleQuotations } from '../../app/features/quotations/services/fixtures'
import { quotationSchema } from '../../app/features/quotations/schemas/quotation'
import { loadQuotations } from '../../app/features/quotations/services/storage'

describe('quotation credit terms', () => {
  const terms = {
    date: '2026-01-31',
    creditMode: 'days' as const,
    creditDays: 30,
    dueDate: '2026-03-02',
  }
  it('synchronizes arbitrary day counts and manual due dates across month boundaries', () => {
    expect(updateCreditTerms(terms, { creditDays: 17 }).dueDate).toBe('2026-02-17')
    expect(updateCreditTerms(terms, { dueDate: '2026-02-28' }).creditDays).toBe(28)
    expect(updateCreditTerms(terms, { date: '2026-02-01' }).dueDate).toBe('2026-03-03')
    expect(updateCreditTerms(terms, { date: '2024-02-01', creditDays: 29 }).dueDate).toBe(
      '2024-03-01',
    )
  })
  it('normalizes cash and restores dated credit when switching modes', () => {
    const cash = updateCreditTerms(terms, { creditMode: 'cash' })
    expect(cash).toMatchObject({ creditDays: 0, dueDate: '2026-01-31' })
    expect(updateCreditTerms(cash, { creditMode: 'days' }).dueDate).toBe('2026-01-31')
    const undated = updateCreditTerms(terms, { creditMode: 'undated' })
    expect(updateCreditTerms(undated, { creditMode: 'days' })).toEqual(terms)
  })
  it('rejects inconsistent dates, negative/fractional credit and cleared due dates', () => {
    const draft = sampleQuotations()[0]!.draft
    expect(quotationSchema.safeParse({ ...draft, dueDate: '' }).success).toBe(false)
    expect(quotationSchema.safeParse({ ...draft, dueDate: draft.date }).success).toBe(false)
    for (const creditDays of [-1, 1.5, 366]) {
      expect(quotationSchema.safeParse({ ...draft, creditDays }).success).toBe(false)
    }
    expect(() => updateCreditTerms(terms, { creditDays: Infinity })).not.toThrow()
  })
  it('loads old saved quotations without deleting data or overriding edited due dates', () => {
    const records = sampleQuotations()
    const legacy = records.map((record) => {
      const draft: Record<string, unknown> = { ...record.draft }
      delete draft.creditMode
      delete draft.dueDate
      return { ...record, draft }
    })
    expect(loadQuotations({ getItem: () => JSON.stringify(legacy) })).toEqual(records)
    const edited = records[0]!
    edited.draft = {
      ...edited.draft,
      ...updateCreditTerms(edited.draft, { dueDate: '2026-09-30' }),
    }
    expect(loadQuotations({ getItem: () => JSON.stringify([edited]) })?.[0]?.draft.dueDate).toBe(
      '2026-09-30',
    )
  })
})
