import { computed, onMounted, ref } from 'vue'
import { createLine, calculateTotals, today } from '../../quotations/model'
import { billingDraftSchema, createBillingDraft, nextBillingNumber } from '../model'
import { useBillingNotesStore } from '../stores/billing-notes'

export function useBillingEditor(recordId?: string) {
  const store = useBillingNotesStore()
  const date = useState('billing-date', today)
  const draft = ref(createBillingDraft(date.value))
  const ready = ref(false)
  const missing = ref(false)
  const errors = ref<Record<string, string>>({})
  const saveError = ref('')
  const baseline = ref('')
  const dirty = computed(() => ready.value && JSON.stringify(draft.value) !== baseline.value)
  const number = computed(
    () =>
      store.state.records.find((item) => item.id === recordId)?.number ??
      nextBillingNumber(
        draft.value.date,
        store.state.records.map((item) => item.number),
      ),
  )
  const totals = computed(() => calculateTotals(draft.value))
  onMounted(() => {
    store.hydrate()
    if (recordId && !store.warning) {
      const record = store.state.records.find((item) => item.id === recordId)
      if (record) draft.value = billingDraftSchema.parse(record.draft)
      else missing.value = true
    }
    baseline.value = JSON.stringify(draft.value)
    ready.value = true
  })
  function validate() {
    errors.value = {}
    saveError.value = ''
    const parsed = billingDraftSchema.safeParse(draft.value)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.value[issue.path.join('.')] ??= issue.message
      return null
    }
    return parsed.data
  }
  function save() {
    const parsed = validate()
    if (!parsed) return null
    try {
      const record = store.save(parsed, recordId)
      baseline.value = JSON.stringify(draft.value)
      return record
    } catch {
      saveError.value =
        'บันทึกไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บและสิทธิ์ของเบราว์เซอร์ หรือลดขนาดไฟล์แนบแล้วลองอีกครั้ง'
      return null
    }
  }
  function addLine() {
    if (draft.value.items.length < 100) draft.value.items.push(createLine(crypto.randomUUID()))
  }
  function removeLine(id: string) {
    draft.value.items = draft.value.items.filter((item) => item.id !== id)
  }
  return {
    store,
    draft,
    ready,
    missing,
    errors,
    saveError,
    dirty,
    number,
    totals,
    save,
    validate,
    addLine,
    removeLine,
  }
}
