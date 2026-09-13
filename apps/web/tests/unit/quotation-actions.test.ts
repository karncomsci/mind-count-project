import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useQuotationsStore } from '../../app/features/quotations/stores/quotations'
import { loadQuotations } from '../../app/features/quotations/services/storage'
import { quotationPdfDefinition } from '../../app/features/quotations/services/pdf-definition'
import { sampleQuotations } from '../../app/features/quotations/services/fixtures'

describe('quotation saved-record actions', () => {
  let storage: {
    getItem: (key: string) => string | null
    setItem: (key: string, value: string) => void
  }
  beforeEach(() => {
    setActivePinia(createPinia())
    const values = new Map<string, string>()
    storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value)
      },
    }
    vi.stubGlobal('window', { localStorage: storage })
  })
  afterEach(() => vi.unstubAllGlobals())
  it('persists pending/accepted/rejected status and deletion', () => {
    const store = useQuotationsStore()
    store.hydrate()
    for (const status of ['pending', 'accepted', 'rejected'] as const) {
      store.setStatus('sample-1', status)
      expect(loadQuotations(storage)?.find((record) => record.id === 'sample-1')?.status).toBe(
        status,
      )
    }
    store.remove('sample-1')
    expect(store.records).toHaveLength(7)
    expect(loadQuotations(storage)?.some((record) => record.id === 'sample-1')).toBe(false)
  })
  it('duplicates into an independent draft with a unique document number', () => {
    const store = useQuotationsStore()
    store.hydrate()
    const copy = store.duplicate('sample-1')
    expect(copy.id).not.toBe('sample-1')
    expect(copy.number).toBe('QT202609130002')
    expect(copy.status).toBe('draft')
    copy.draft.customer.name = 'เปลี่ยนเฉพาะสำเนา'
    expect(store.records.find((record) => record.id === 'sample-1')?.draft.customer.name).not.toBe(
      copy.draft.customer.name,
    )
  })
  it('keeps state intact if browser persistence rejects a mutation', () => {
    const store = useQuotationsStore()
    store.hydrate()
    const before = JSON.stringify(store.records)
    storage.setItem = () => {
      throw new Error('quota')
    }
    expect(() => store.setStatus('sample-1', 'accepted')).toThrow('quota')
    expect(() => store.remove('sample-1')).toThrow('quota')
    expect(() => store.duplicate('sample-1')).toThrow('quota')
    expect(JSON.stringify(store.records)).toBe(before)
  })
})

describe('PDF public document definition', () => {
  it('includes selected documents, due dates and totals but never internal notes', () => {
    const records = sampleQuotations().slice(0, 2)
    records[0]!.draft.internalNote = 'SECRET-INTERNAL-NOTE'
    const definition = quotationPdfDefinition(records)
    const serialized = JSON.stringify(definition)
    expect(serialized).toContain(records[0]!.number)
    expect(serialized).toContain(records[1]!.number)
    expect(serialized).not.toContain('QT202609110001')
    expect(serialized).not.toContain('SECRET-INTERNAL-NOTE')
    expect(serialized).toContain('16,050.00')
    expect(serialized).toContain('"pageBreak":"before"')
    records[0]!.draft.creditMode = 'undated'
    expect(JSON.stringify(quotationPdfDefinition([records[0]!]))).not.toContain('ครบกำหนด')
  })
})
