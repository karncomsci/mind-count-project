import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBillingNotesStore } from '../../app/features/billing-notes/stores/billing-notes'
import { documentPdfDefinition } from '../../app/features/quotations/documents'
import {
  billingDraftSchema,
  createBillingDraft,
  nextBillingNumber,
  projectSchema,
  warehouseSchema,
} from '../../app/features/billing-notes/model'
import { calculateTotals } from '../../app/features/quotations/services/calculations'
import {
  loadBillingState,
  saveBillingState,
  BILLING_STORAGE_KEY,
  initialBillingState,
} from '../../app/features/billing-notes/services/storage'

function validDraft() {
  const draft = createBillingDraft('2026-09-13')
  draft.customer.name = 'ลูกค้าทดสอบ'
  draft.items[0] = {
    ...draft.items[0]!,
    description: 'คอม',
    unit: 'เครื่อง',
    unitPrice: 20000,
    withholdingRate: 3,
  }
  return draft
}

describe('billing notes', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('calculates the reference totals and accepts the document', () => {
    const draft = billingDraftSchema.parse(validDraft())
    expect(calculateTotals(draft)).toMatchObject({
      subtotal: 2000000,
      vat: 140000,
      withholding: 60000,
      total: 2140000,
      payable: 2080000,
    })
    expect(draft.dueDate).toBe('2026-10-13')
  })
  it('numbers each billing day independently, ignoring quotation and malformed numbers', () => {
    expect(
      nextBillingNumber('2026-09-13', [
        'BL202609130002',
        'QT202609139999',
        'BL202609120020',
        'BL20260913bad',
      ]),
    ).toBe('BL202609130003')
    expect(nextBillingNumber('2026-09-14', [])).toBe('BL202609140001')
  })
  it('rejects incomplete documents and invalid project/warehouse details', () => {
    expect(billingDraftSchema.safeParse(createBillingDraft('2026-09-13')).success).toBe(false)
    expect(projectSchema.safeParse({ id: '1', name: ' ', customer: '' }).success).toBe(false)
    expect(
      warehouseSchema.safeParse({
        id: '1',
        name: 'คลัง',
        code: '',
        address: '',
        postalCode: '12',
        purpose: '',
        contact: '',
        email: 'invalid',
        phone: '',
      }).success,
    ).toBe(false)
  })
  it('round-trips documents and catalogs without touching quotation storage', () => {
    const values = new Map<string, string>([['mind-count:quotations:demo:v1', 'quotation-data']])
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value)
      },
    }
    const state = initialBillingState()
    state.records.push({
      id: 'billing-1',
      number: 'BL202609130001',
      updatedAt: '2026-09-13T00:00:00.000Z',
      draft: validDraft(),
    })
    state.projects.push({ id: 'project-1', name: 'งานใหม่', customer: 'ลูกค้าทดสอบ' })
    saveBillingState(storage, state)
    expect(loadBillingState(storage)).toEqual(state)
    expect(values.get('mind-count:quotations:demo:v1')).toBe('quotation-data')
    expect(values.has(BILLING_STORAGE_KEY)).toBe(true)
  })
  it('surfaces corrupt storage and quota errors instead of replacing data', () => {
    expect(() => loadBillingState({ getItem: () => '{broken' })).toThrow()
    expect(() =>
      saveBillingState(
        {
          setItem: () => {
            throw new Error('QuotaExceededError')
          },
        },
        initialBillingState(),
      ),
    ).toThrow('QuotaExceededError')
  })
  it('rejects executable attachment URLs', () => {
    const draft = validDraft()
    expect(
      billingDraftSchema.safeParse({
        ...draft,
        attachments: [
          {
            id: 'a',
            name: 'file.png',
            type: 'image/png',
            size: 10,
            dataUrl: 'javascript:alert(1)',
          },
        ],
      }).success,
    ).toBe(false)
  })
  it('generates billing PDFs with signature spaces while retaining quotation defaults and hiding internal notes', () => {
    const draft = validDraft()
    draft.internalNote = 'private-internal-note'
    const record = {
      id: '1',
      number: 'BL202609130001',
      status: 'draft' as const,
      updatedAt: '',
      draft,
    }
    const billing = JSON.stringify(
      documentPdfDefinition([record], { title: 'ใบวางบิล', signatureEnabled: true }),
    )
    expect(billing).toContain('ใบวางบิล')
    expect(billing).toContain('ผู้รับวางบิล / วันที่')
    expect(billing).not.toContain('private-internal-note')
    const quotation = JSON.stringify(
      documentPdfDefinition([{ ...record, number: 'QT202609130001' }]),
    )
    expect(quotation).toContain('ใบเสนอราคา')
    expect(quotation).not.toContain('ผู้รับวางบิล / วันที่')
  })
  it('preserves state on failed saves, prevents duplicate catalogs, and rereads the latest document sequence', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: vi.fn((key: string, value: string) => {
        values.set(key, value)
      }),
    }
    vi.stubGlobal('window', { localStorage: storage })
    setActivePinia(createPinia())
    const store = useBillingNotesStore()
    store.hydrate()
    const first = store.save(validDraft())
    expect(first.number).toBe('BL202609130001')
    storage.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => store.save(validDraft())).toThrow('QuotaExceededError')
    expect(store.state.records).toHaveLength(1)
    const latest = loadBillingState(storage)
    latest.records.push({ ...first, id: 'other-tab', number: 'BL202609130002' })
    saveBillingState(storage, latest)
    expect(store.save(validDraft()).number).toBe('BL202609130003')
    expect(store.state.records).toHaveLength(3)
    expect(() =>
      store.addProject({ id: 'duplicate', name: ' คอมพิวเตอร์ ', customer: '' }),
    ).toThrow('มีชื่อโปรเจ็คนี้แล้ว')
    const warehouse = {
      ...initialBillingState().warehouses[0]!,
      id: 'new',
      name: 'คลังใหม่',
      code: 'BKK',
    }
    store.addWarehouse(warehouse)
    expect(() =>
      store.addWarehouse({ ...warehouse, id: 'new-2', name: 'คลังอื่น', code: 'bkk' }),
    ).toThrow('ชื่อหรือรหัสคลังสินค้านี้มีอยู่แล้ว')
  })
})
