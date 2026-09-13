<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { DropdownItem } from './dropdown'
defineOptions({ inheritAttrs: false })
const props = defineProps<{
  label: string
  items: DropdownItem[]
  disabled?: boolean
  wide?: boolean
}>()
const emit = defineEmits<{ select: [id: string] }>()
const open = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLDivElement | null>(null)
const position = ref({ left: '0px', top: '0px', maxHeight: '400px' })
const id = useId()
function close(focus = false) {
  open.value = false
  if (focus) trigger.value?.focus()
}
async function toggle() {
  if (open.value) return close()
  const box = trigger.value?.getBoundingClientRect()
  if (!box) return
  const width = Math.min(props.wide ? 390 : 220, window.innerWidth - 24)
  position.value = {
    left: `${Math.max(12, Math.min(box.right - width, window.innerWidth - width - 12))}px`,
    top: `${Math.min(box.bottom + 5, window.innerHeight - 160)}px`,
    maxHeight: `${Math.max(140, window.innerHeight - Math.min(box.bottom + 5, window.innerHeight - 160) - 12)}px`,
  }
  open.value = true
  await nextTick()
  panel.value?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
}
function choose(item: DropdownItem) {
  if (item.disabled) return
  close(true)
  emit('select', item.id)
}
function outside(event: PointerEvent) {
  const target = event.target as Node
  if (!panel.value?.contains(target) && !trigger.value?.contains(target)) close()
}
function move(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close(true)
    return
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const buttons = [
    ...(panel.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
  ]
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
  buttons[next]?.focus()
}
function blur(event: FocusEvent) {
  if (!panel.value?.contains(event.relatedTarget as Node) && event.relatedTarget !== trigger.value)
    close()
}
function resized() {
  close()
}
onMounted(() => {
  document.addEventListener('pointerdown', outside)
  window.addEventListener('resize', resized)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside)
  window.removeEventListener('resize', resized)
})
</script>

<template>
  <button
    ref="trigger"
    v-bind="$attrs"
    type="button"
    class="dropdown-trigger"
    :aria-label="label"
    :aria-expanded="open"
    :aria-controls="id"
    :disabled="disabled"
    @click="toggle"
    @keydown.down.prevent="toggle"
  >
    <slot />
  </button>
  <Teleport to="body">
    <div
      v-if="open"
      :id="id"
      ref="panel"
      class="app-dropdown print:hidden"
      :class="{ 'dropdown-wide': wide }"
      :style="position"
      role="group"
      :aria-label="label"
      @keydown="move"
      @focusout="blur"
    >
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        :disabled="item.disabled"
        :class="{ 'dropdown-separator': item.separator, 'text-rose-600': item.danger }"
        :title="item.disabled ? 'ยังไม่เปิดใช้งาน' : undefined"
        @click="choose(item)"
      >
        <AppIcon v-if="item.icon" :name="item.icon" class="h-4 w-4" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </Teleport>
</template>
