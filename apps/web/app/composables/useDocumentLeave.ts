import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

// Shared by every editable sales-document page. Native beforeunload remains
// necessary for browser refresh/tab close, which cannot display an app dialog.
export function useDocumentLeave(
  dirty: Ref<boolean>,
  save: () => boolean | Promise<boolean>,
  onInvalid: () => void | Promise<void>,
) {
  const leaveOpen = ref(false),
    leaveBusy = ref(false)
  let resolveNavigation: ((leave: boolean) => void) | null = null
  function finish(leave: boolean) {
    leaveOpen.value = false
    resolveNavigation?.(leave)
    resolveNavigation = null
  }
  function confirmLeave() {
    if (!dirty.value) return true
    return new Promise<boolean>((resolve) => {
      resolveNavigation?.(false)
      resolveNavigation = resolve
      leaveOpen.value = true
    })
  }
  onBeforeRouteLeave(confirmLeave)
  onBeforeRouteUpdate(confirmLeave)
  async function saveAndLeave() {
    if (leaveBusy.value) return
    leaveBusy.value = true
    let saved = false
    try {
      saved = await save()
    } finally {
      leaveBusy.value = false
      finish(saved)
      if (!saved) await onInvalid()
    }
  }
  function beforeUnload(event: BeforeUnloadEvent) {
    if (dirty.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  }
  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', beforeUnload)
    resolveNavigation?.(false)
  })
  return {
    leaveOpen,
    leaveBusy,
    saveAndLeave,
    cancelLeave: () => finish(false),
    discardAndLeave: () => finish(true),
  }
}
