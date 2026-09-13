<script setup lang="ts">
defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const element = ref<HTMLDialogElement | null>(null)
const titleId = useId()
let previousFocus: HTMLElement | null = null
onMounted(() => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  element.value?.showModal()
})
onBeforeUnmount(() => {
  element.value?.close()
  if (previousFocus?.isConnected) previousFocus.focus()
})
</script>
<template>
  <dialog
    ref="element"
    class="app-dialog"
    :aria-labelledby="titleId"
    @cancel.prevent="emit('close')"
  >
    <h2 :id="titleId" class="text-lg font-semibold text-slate-700">{{ title }}</h2>
    <div class="my-5 text-sm leading-6 text-slate-600"><slot /></div>
    <div class="flex flex-wrap justify-end gap-3"><slot name="actions" /></div>
  </dialog>
</template>
