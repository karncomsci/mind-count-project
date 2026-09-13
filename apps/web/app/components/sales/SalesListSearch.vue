<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import FormField from '~/components/base/FormField.vue'
import {
  localDate as today,
  documentDateRange as billingDateRange,
  type SalesFilters as BillingFilters,
  type SalesPeriod as BillingPeriod,
} from './search'
defineProps<{ title: string; statuses: { id: string; label: string }[] }>()
const inputId = useId()
const filters = defineModel<BillingFilters>({ required: true })
const open = ref(false),
  advanced = ref(false)
const root = ref<HTMLElement | null>(null),
  trigger = ref<HTMLButtonElement | null>(null),
  input = ref<HTMLInputElement | null>(null)
const query = ref(''),
  status = ref<BillingFilters['status']>('all')
const period = ref<BillingPeriod>('all'),
  start = ref(''),
  end = ref('')
const fiscalYear = ref(Number(today().slice(0, 4))),
  startMonth = ref(1)
const error = ref('')
const active = computed(
  () =>
    !!(
      filters.value.query ||
      filters.value.start ||
      filters.value.end ||
      (filters.value.status && filters.value.status !== 'all')
    ),
)
function close() {
  open.value = false
  trigger.value?.focus()
}
async function toggle() {
  if (open.value) return close()
  query.value = filters.value.query ?? ''
  status.value = filters.value.status ?? 'all'
  start.value = filters.value.start ?? ''
  end.value = filters.value.end ?? ''
  period.value = start.value ? 'custom' : 'all'
  open.value = true
  await nextTick()
  input.value?.focus()
}
function apply() {
  error.value = ''
  if (period.value === 'custom' && (!start.value || !end.value || start.value > end.value)) {
    error.value = 'กรุณาเลือกช่วงวันที่เริ่มต้นถึงสิ้นสุดให้ถูกต้อง'
    return
  }
  const range =
    period.value === 'custom'
      ? { start: start.value, end: end.value }
      : billingDateRange(period.value, today(), fiscalYear.value, startMonth.value)
  filters.value = { query: query.value, status: status.value, ...range }
  close()
}
function clear() {
  query.value = ''
  status.value = 'all'
  period.value = 'all'
  start.value = ''
  end.value = ''
  filters.value = {}
  error.value = ''
  close()
}
function outside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>
<template>
  <div ref="root" class="billing-search" @keydown.esc.stop.prevent="close">
    <button
      ref="trigger"
      type="button"
      class="batch-action"
      :class="{ 'text-sky-600 border-sky-400': active }"
      :aria-label="`เปิดค้นหา${title}`"
      :aria-expanded="open"
      @click="toggle"
    >
      <AppIcon name="search" />
    </button>
    <form
      v-if="open"
      class="billing-search-panel"
      role="dialog"
      :aria-label="`ค้นหา${title}`"
      @submit.prevent="apply"
    >
      <div class="flex items-center justify-between gap-3">
        <label :for="inputId" class="text-sm font-medium">ค้นหา:</label>
        <span class="text-[10px] text-slate-400">แสดงผลไม่เกิน 250 รายการ</span>
      </div>
      <input
        :id="inputId"
        ref="input"
        v-model="query"
        type="search"
        class="form-input mt-3"
        :aria-label="`ค้นหา${title}`"
      />
      <p class="mt-2 text-[11px] leading-5 text-slate-400">
        ค้นหาจากชื่อลูกค้า/ชื่อผู้จำหน่าย, เลขที่เอกสาร, โปรเจ็ค, รายละเอียด
      </p>
      <button
        type="button"
        class="my-4 flex w-full items-center justify-between border-y border-slate-100 py-3 text-sm"
        :aria-expanded="advanced"
        @click="advanced = !advanced"
      >
        ค้นหาเพิ่มเติม
        <AppIcon name="chevron" class="h-4 w-4" :class="{ 'rotate-90': advanced }" />
      </button>
      <div v-if="advanced" class="space-y-4">
        <FormField label="ช่วงเวลา">
          <select v-model="period" class="form-input">
            <option value="all">แสดงทั้งหมด</option>
            <option value="month">เดือนปัจจุบัน</option>
            <option value="previous-month">เดือนก่อน</option>
            <option value="custom">เลือกช่วงวันที่</option>
            <option value="year">ปีปัจจุบัน</option>
            <option value="previous-year">ปีก่อน</option>
            <option value="fiscal">ปีงบประมาณ</option>
          </select>
        </FormField>
        <div v-if="period === 'custom'" class="grid grid-cols-2 gap-3">
          <FormField label="วันที่เริ่มต้น">
            <input v-model="start" type="date" class="form-input" required />
          </FormField>
          <FormField label="วันที่สิ้นสุด">
            <input v-model="end" type="date" class="form-input" :min="start" required />
          </FormField>
        </div>
        <div v-if="period === 'fiscal'" class="grid grid-cols-2 gap-3">
          <FormField label="ปีที่เริ่ม (ค.ศ.)">
            <input
              v-model.number="fiscalYear"
              type="number"
              min="1900"
              max="9998"
              class="form-input"
              required
            />
          </FormField>
          <FormField label="เดือนเริ่มปีงบประมาณ">
            <select v-model.number="startMonth" class="form-input">
              <option v-for="month in 12" :key="month" :value="month">เดือน {{ month }}</option>
            </select>
          </FormField>
        </div>
        <FormField label="สถานะเอกสาร">
          <select v-model="status" class="form-input">
            <option value="all">แสดงทั้งหมด</option>
            <option v-for="value in statuses" :key="value.id" :value="value.id">
              {{ value.label }}
            </option>
          </select>
        </FormField>
      </div>
      <p v-if="error" role="alert" class="field-error">{{ error }}</p>
      <div class="mt-5 flex justify-end gap-2">
        <button type="button" class="button button-white" @click="clear">ล้างการค้นหา</button>
        <button type="submit" class="button button-blue">ค้นหา</button>
      </div>
    </form>
  </div>
</template>
