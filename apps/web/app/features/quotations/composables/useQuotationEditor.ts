import { computed, onMounted, ref } from 'vue'
import { useQuotationsStore } from '../stores/quotations'
import { createDraft, createLine } from '../services/fixtures'
import { calculateTotals } from '../services/calculations'
import { nextDocumentNumber, today } from '../services/format'
import { quotationSchema } from '../schemas/quotation'

export function useQuotationEditor(recordId?: string) {
  const store = useQuotationsStore()
  const initialDate = useState('quotation-date', today)
  const draft = ref(createDraft(initialDate.value))
  const errors = ref<Record<string, string>>({})
  const saveError = ref('')
  const missing = ref(false)
  const saved = ref(false)
  const ready = ref(false)
  const baseline = ref('')
  const record = computed(() => store.records.find((item) => item.id === recordId))
  const documentNumber = computed(
    () =>
      record.value?.number ??
      nextDocumentNumber(
        draft.value.date,
        store.records.map((item) => item.number),
      ),
  )
  const totals = computed(() => calculateTotals(draft.value))
  const dirty = computed(
    () => !!baseline.value && JSON.stringify(draft.value) !== baseline.value && !saved.value,
  )
  onMounted(() => {
    store.hydrate()
    if (recordId) {
      if (record.value) draft.value = JSON.parse(JSON.stringify(record.value.draft))
      else missing.value = true
    }
    baseline.value = JSON.stringify(draft.value)
    ready.value = true
  })
  function addLine() {
    if (draft.value.items.length < 100)
      draft.value.items = [...draft.value.items, createLine(crypto.randomUUID())]
  }
  function removeLine(id: string) {
    draft.value.items = draft.value.items.filter((item) => item.id !== id)
  }
  function save() {
    const parsed = quotationSchema.safeParse(draft.value)
    errors.value = {}
    saveError.value = ''
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.value[issue.path.join('.')] ??= issue.message
      return null
    }
    try {
      const result = store.save(parsed.data, recordId)
      saved.value = true
      return result
    } catch {
      saveError.value =
        'บันทึกไม่สำเร็จ โปรดตรวจสอบว่ามีพื้นที่จัดเก็บและอนุญาตให้เว็บไซต์บันทึกข้อมูลในเบราว์เซอร์'
    }
    return null
  }
  return {
    ready,
    draft,
    errors,
    saveError,
    missing,
    documentNumber,
    totals,
    dirty,
    addLine,
    removeLine,
    save,
  }
}
