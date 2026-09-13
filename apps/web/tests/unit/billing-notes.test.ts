import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { readBilling, mutateBilling } from '../../app/features/billing-notes/services/api'
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
vi.mock('../../app/features/billing-notes/services/api', () => ({
  readBilling: vi.fn(),
  mutateBilling: vi.fn(),
}))

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
      status: 'draft',
      version: 0,
      kind: 'billing',
      deletedAt: null,
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
  it('preserves state on failed API writes and sends the last-read version', async () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => null } })
    vi.mocked(readBilling).mockResolvedValue(initialBillingState())
    setActivePinia(createPinia())
    const store = useBillingNotesStore()
    await store.hydrate()
    const record = {
      id: 'one',
      number: 'BL202609130001',
      version: 1,
      status: 'draft' as const,
      kind: 'billing' as const,
      deletedAt: null,
      updatedAt: '2026-09-13T00:00:00Z',
      draft: validDraft(),
    }
    vi.mocked(mutateBilling).mockResolvedValueOnce({ record })
    await store.save(validDraft())
    vi.mocked(mutateBilling).mockRejectedValueOnce(new Error('version conflict'))
    await expect(store.save(validDraft(), 'one')).rejects.toThrow('version conflict')
    expect(store.state.records).toEqual([record])
    expect(mutateBilling).toHaveBeenLastCalledWith({
      operation: 'save',
      id: 'one',
      version: 1,
      draft: expect.objectContaining({ customer: record.draft.customer }),
    })
    vi.mocked(mutateBilling).mockRejectedValueOnce(new Error('duplicate'))
    await expect(store.addProject({ id: 'p', name: 'new', customer: '' })).rejects.toThrow(
      'duplicate',
    )
    expect(store.state.projects).toEqual(initialBillingState().projects)
  })
  it('keeps the original browser payload when import fails partway through', async () => {
    const original = JSON.stringify(initialBillingState())
    const storage = { getItem: () => original, setItem: vi.fn(), removeItem: vi.fn() }
    vi.stubGlobal('window', { localStorage: storage })
    vi.mocked(readBilling).mockResolvedValue(initialBillingState())
    setActivePinia(createPinia())
    const store = useBillingNotesStore()
    await store.hydrate()
    vi.mocked(mutateBilling)
      .mockResolvedValueOnce({ project: initialBillingState().projects[0]! })
      .mockRejectedValueOnce(new Error('offline'))
    await store.importLegacy()
    expect(store.legacyWarning).toBe('offline')
    expect(store.legacy).not.toBeNull()
    expect(storage.removeItem).not.toHaveBeenCalled()
    expect(storage.setItem).not.toHaveBeenCalled()
  })
})
