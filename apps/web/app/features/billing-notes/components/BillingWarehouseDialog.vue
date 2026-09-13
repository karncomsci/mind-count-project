<script setup lang="ts">
import AppDialog from '~/components/base/AppDialog.vue'
import AppIcon from '~/components/base/AppIcon.vue'
import FormField from '~/components/base/FormField.vue'
import { warehouseSchema } from '../model'
import { useBillingNotesStore } from '../stores/billing-notes'
const emit = defineEmits<{ close: []; saved: [name: string] }>()
const store = useBillingNotesStore()
const formId = useId()
const fields = reactive({
  name: '',
  code: '',
  address: '',
  postalCode: '',
  purpose: '',
  contact: '',
  email: '',
  phone: '',
})
const errors = ref<Record<string, string>>({})
const saveError = ref('')
function save() {
  errors.value = {}
  saveError.value = ''
  const parsed = warehouseSchema.safeParse({ id: crypto.randomUUID(), ...fields })
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors.value[issue.path.join('.')] ??= issue.message
    return
  }
  try {
    emit('saved', store.addWarehouse(parsed.data).name)
  } catch (cause) {
    saveError.value =
      cause instanceof Error && cause.message === 'ชื่อหรือรหัสคลังสินค้านี้มีอยู่แล้ว'
        ? cause.message
        : 'บันทึกคลังสินค้าไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์'
  }
}
</script>

<template>
  <Teleport to="body">
    <AppDialog
      title="สร้างคลังสินค้า"
      class="billing-dialog billing-warehouse-dialog"
      @close="emit('close')"
    >
      <button
        type="button"
        class="billing-dialog-close"
        aria-label="ปิดหน้าต่างสร้างคลังสินค้า"
        @click="emit('close')"
      >
        <AppIcon name="close" />
      </button>
      <form :id="formId" class="billing-dialog-fields" novalidate @submit.prevent="save">
        <FormField label="ชื่อคลังสินค้า" :error="errors.name" required>
          <input v-model="fields.name" class="form-input" maxlength="100" autofocus />
        </FormField>
        <FormField label="รหัสคลังสินค้า">
          <input v-model="fields.code" class="form-input" maxlength="30" />
        </FormField>
        <FormField label="ที่อยู่">
          <textarea v-model="fields.address" class="form-input" rows="3" maxlength="1000" />
        </FormField>
        <FormField label="รหัสไปรษณีย์" :error="errors.postalCode">
          <input v-model="fields.postalCode" class="form-input" inputmode="numeric" maxlength="5" />
        </FormField>
        <FormField label="จุดประสงค์การใช้งาน" :error="errors.purpose" required>
          <select v-model="fields.purpose" class="form-input">
            <option value="">เลือกจุดประสงค์</option>
            <option>ซื้อและขาย</option>
            <option>ซื้อสินค้า</option>
            <option>ขายสินค้า</option>
          </select>
        </FormField>
        <h3 class="billing-dialog-section">ชื่อผู้ติดต่อ/ผู้ดูแลคลัง</h3>
        <FormField label="ชื่อผู้ติดต่อ/ผู้ดูแล">
          <input v-model="fields.contact" class="form-input" maxlength="200" />
        </FormField>
        <FormField label="อีเมล" :error="errors.email">
          <input v-model="fields.email" class="form-input" type="email" />
        </FormField>
        <FormField label="เบอร์โทรศัพท์">
          <input v-model="fields.phone" class="form-input" type="tel" maxlength="30" />
        </FormField>
        <p v-if="saveError" role="alert" class="field-error">{{ saveError }}</p>
      </form>
      <template #actions>
        <button type="button" class="button button-white" @click="emit('close')">ยกเลิก</button>
        <button type="submit" :form="formId" class="button button-green">บันทึก</button>
      </template>
    </AppDialog>
  </Teleport>
</template>
