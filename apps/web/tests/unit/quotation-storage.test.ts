import { describe, expect, it } from 'vitest'
import {
  loadQuotations,
  saveQuotations,
  STORAGE_KEY,
} from '../../app/features/quotations/services/storage'
import { sampleQuotations } from '../../app/features/quotations/services/fixtures'

describe('quotation browser storage boundary', () => {
  it('round trips sample documents and distinguishes a saved empty list', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value)
      },
    }
    expect(loadQuotations(storage)).toBeNull()
    saveQuotations(storage, sampleQuotations())
    expect(loadQuotations(storage)).toEqual(sampleQuotations())
    saveQuotations(storage, [])
    expect(loadQuotations(storage)).toEqual([])
  })
  it('rejects malformed data and propagates denied writes', () => {
    expect(() => loadQuotations({ getItem: () => '{broken' })).toThrow()
    expect(() => loadQuotations({ getItem: () => JSON.stringify([{ id: 'invalid' }]) })).toThrow()
    expect(() =>
      saveQuotations(
        {
          setItem: (key) => {
            expect(key).toBe(STORAGE_KEY)
            throw new Error('quota')
          },
        },
        sampleQuotations(),
      ),
    ).toThrow('quota')
  })
})
