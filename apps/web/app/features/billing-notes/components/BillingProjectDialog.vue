<script setup lang="ts">
import AppDialog from '~/components/base/AppDialog.vue'
import AppIcon from '~/components/base/AppIcon.vue'
import FormField from '~/components/base/FormField.vue'
import { sampleCustomers } from '../../quotations/model'
import { projectSchema } from '../model'
import { useBillingNotesStore } from '../stores/billing-notes'
const props = defineProps<{ customer: string }>()
const emit = defineEmits<{ close: []; saved: [name: string] }>()
const store = useBillingNotesStore()
const formId = useId()
const busy = ref(false)
const name = ref('')
const customer = ref(props.customer)
const error = ref('')
const customers = computed(() => [
  ...new Set([props.customer, ...sampleCustomers.map((item) => item.name)].filter(Boolean)),
])
async function save() {
  if (busy.value) return
  const parsed = projectSchema.safeParse({
    id: crypto.randomUUID(),
    name: name.value,
    customer: customer.value,
  })
  if (!parsed.success) {
    error.value = parsed.error.issues[0]!.message
    return
  }
  busy.value = true
  try {
    emit('saved', (await store.addProject(parsed.data)).name)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <AppDialog title="สร้างโปรเจ็ค" class="billing-dialog" @close="!busy && emit('close')">
      <button
        type="button"
        class="billing-dialog-close"
        aria-label="ปิดหน้าต่างสร้างโปรเจ็ค"
        :disabled="busy"
        @click="emit('close')"
      >
        <AppIcon name="close" />
      </button>
      <form :id="formId" class="billing-dialog-fields" novalidate @submit.prevent="save">
        <FormField label="ชื่อโปรเจ็ค" required>
          <input
            v-model="name"
            class="form-input"
            placeholder="กรุณาระบุชื่อโปรเจ็ค"
            maxlength="200"
            autofocus
          />
        </FormField>
        <FormField label="ชื่อลูกค้า/ผู้จำหน่าย">
          <select v-model="customer" class="form-input">
            <option value="">เลือกลูกค้า</option>
            <option v-for="item in customers" :key="item" :value="item">{{ item }}</option>
          </select>
        </FormField>
        <p v-if="error" role="alert" class="field-error">{{ error }}</p>
      </form>
      <template #actions>
        <button type="button" class="button button-white" :disabled="busy" @click="emit('close')">
          ยกเลิก
        </button>
        <button type="submit" :disabled="busy" :form="formId" class="button button-green">
          บันทึก
        </button>
      </template>
    </AppDialog>
  </Teleport>
</template>
