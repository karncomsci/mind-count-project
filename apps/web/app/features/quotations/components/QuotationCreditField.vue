<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import type { CreditMode } from '../types'

defineProps<{ mode: CreditMode; days: number; error?: string }>()
const emit = defineEmits<{ mode: [value: CreditMode]; days: [value: number] }>()
const open = ref(false)
const field = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const inputId = useId()
const options: { value: CreditMode; label: string }[] = [
  { value: 'days', label: 'เครดิต (วัน)' },
  { value: 'cash', label: 'เงินสด' },
  { value: 'undated', label: 'เครดิต (ไม่แสดงวันที่)' },
]
function selectMode(mode: CreditMode) {
  emit('mode', mode)
  open.value = false
  trigger.value?.focus()
}
function closeOutside(event: PointerEvent) {
  if (event.target instanceof Node && !field.value?.contains(event.target)) open.value = false
}
function escape() {
  open.value = false
  trigger.value?.focus()
}
function blur(event: FocusEvent) {
  if (!(event.relatedTarget instanceof Node) || !field.value?.contains(event.relatedTarget))
    open.value = false
}
onMounted(() => document.addEventListener('pointerdown', closeOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside))
</script>

<template>
  <div ref="field" class="form-field relative" @keydown.esc.prevent="escape" @focusout="blur">
    <label v-if="mode === 'days'" :for="inputId" class="field-label">เครดิต (วัน)</label>
    <span v-else class="field-label">เครดิต</span>
    <div class="credit-input-group">
      <input
        v-if="mode === 'days'"
        :id="inputId"
        :value="days"
        type="number"
        min="0"
        max="365"
        step="1"
        class="form-input rounded-r-none! border-r-0!"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        @input="emit('days', Number(($event.target as HTMLInputElement).value))"
      />
      <span v-else class="form-input rounded-r-none! border-r-0!">
        {{ mode === 'cash' ? 'เงินสด' : 'เครดิต (ไม่แสดงวันที่)' }}
      </span>
      <button
        ref="trigger"
        type="button"
        class="credit-type-trigger"
        aria-label="เลือกประเภทเครดิต"
        :aria-expanded="open"
        :aria-controls="`${inputId}-options`"
        @click="open = !open"
      >
        <AppIcon name="down" class="h-4 w-4" />
      </button>
    </div>
    <div
      v-if="open"
      :id="`${inputId}-options`"
      class="credit-type-options"
      role="group"
      aria-label="ประเภทเครดิต"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-pressed="mode === option.value"
        :class="{ 'bg-sky-50 text-sky-600': mode === option.value }"
        @click="selectMode(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
    <span v-if="error" :id="`${inputId}-error`" class="field-error">{{ error }}</span>
  </div>
</template>
