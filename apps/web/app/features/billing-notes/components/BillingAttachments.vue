<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import { attachmentSchema, type BillingAttachment } from '../model'
const files = defineModel<BillingAttachment[]>({ required: true })
const emit = defineEmits<{ busy: [value: boolean] }>()
const busy = ref(false)
const error = ref('')
const input = ref<HTMLInputElement | null>(null)
async function upload(incoming: FileList | null) {
  if (!incoming?.length || busy.value) return
  error.value = ''
  busy.value = true
  emit('busy', true)
  try {
    const selected = Array.from(incoming)
    if (files.value.length + selected.length > 3) throw new Error('แนบไฟล์ได้ไม่เกิน 3 ไฟล์')
    if ([...files.value, ...selected].reduce((sum, file) => sum + file.size, 0) > 1536 * 1024)
      throw new Error('ไฟล์แนบรวมต้องไม่เกิน 1.5 MB')
    const added: BillingAttachment[] = []
    for (const file of selected) {
      if (
        !['image/png', 'image/jpeg', 'application/pdf'].includes(file.type) ||
        file.size > 1024 * 1024 ||
        !file.size
      )
        throw new Error('เลือกไฟล์ PNG, JPG หรือ PDF ขนาดไม่เกิน 1 MB ต่อไฟล์')
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
        reader.readAsDataURL(file)
      })
      added.push(
        attachmentSchema.parse({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
        }),
      )
    }
    files.value = [...files.value, ...added]
  } catch (cause) {
    error.value =
      cause instanceof Error && !('issues' in cause) ? cause.message : 'ไฟล์แนบไม่ถูกต้อง'
  } finally {
    busy.value = false
    emit('busy', false)
    if (input.value) input.value.value = ''
  }
}
</script>

<template>
  <section class="mt-6" aria-label="ไฟล์แนบ">
    <input
      ref="input"
      type="file"
      class="sr-only"
      aria-label="แนบไฟล์"
      accept="image/png,image/jpeg,application/pdf"
      multiple
      :disabled="busy"
      @change="upload(($event.target as HTMLInputElement).files)"
    />
    <button
      type="button"
      class="billing-upload"
      :disabled="busy"
      @click="input?.click()"
      @dragover.prevent
      @drop.prevent="upload($event.dataTransfer?.files ?? null)"
    >
      <AppIcon name="document" class="h-6 w-6" />
      <span>
        {{ busy ? 'กำลังอ่านไฟล์…' : 'คลิกเพื่อเลือกไฟล์' }}
        <br />
        หรือลากและวางไฟล์ที่นี่
      </span>
      <span class="text-[10px] text-slate-400">PNG, JPG, PDF · สูงสุด 1 MB/ไฟล์</span>
    </button>
    <p v-if="error" role="alert" class="field-error">{{ error }}</p>
    <ul v-if="files.length" class="mt-3 space-y-2">
      <li v-for="file in files" :key="file.id" class="flex items-center gap-2 text-xs">
        <a
          :href="file.dataUrl"
          :download="file.name"
          class="min-w-0 truncate text-sky-600 underline"
        >
          {{ file.name }}
        </a>
        <button
          type="button"
          class="line-delete"
          :disabled="busy"
          :aria-label="`ลบไฟล์ ${file.name}`"
          @click="files = files.filter((item) => item.id !== file.id)"
        >
          <AppIcon name="close" class="h-4 w-4" />
        </button>
      </li>
    </ul>
  </section>
</template>
