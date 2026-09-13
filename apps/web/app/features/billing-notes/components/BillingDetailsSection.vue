<script setup lang="ts">
import AppDropdown from '~/components/base/AppDropdown.vue'
import AppIcon from '~/components/base/AppIcon.vue'
import FormField from '~/components/base/FormField.vue'
import BillingProjectDialog from './BillingProjectDialog.vue'
import BillingWarehouseDialog from './BillingWarehouseDialog.vue'
import type { BillingDraft } from '../model'
import { useBillingNotesStore } from '../stores/billing-notes'
const props = defineProps<{ draft: BillingDraft }>()
const emit = defineEmits<{ patch: [value: Partial<BillingDraft>] }>()
const store = useBillingNotesStore()
const modal = ref<'project' | 'warehouse' | null>(null)
const projects = computed(() => [
  { id: 'none', label: 'ไม่ระบุโปรเจ็ค' },
  ...store.state.projects.map((item) => ({ id: item.id, label: item.name })),
  { id: 'add', label: 'เพิ่มโปรเจ็ค', icon: 'plus' as const, separator: true },
])
const warehouses = computed(() => [
  ...store.state.warehouses.map((item, index) => ({
    id: item.id,
    label: `${item.name}${index === 0 ? ' (คลังหลัก)' : ''}`,
  })),
  { id: 'add', label: 'เพิ่มคลังสินค้า', icon: 'plus' as const, separator: true },
])
function select(kind: 'project' | 'warehouse', id: string) {
  if (id === 'add') {
    modal.value = kind
    return
  }
  const options = kind === 'project' ? store.state.projects : store.state.warehouses
  emit('patch', { [kind]: options.find((item) => item.id === id)?.name ?? '' })
}
function created(kind: 'project' | 'warehouse', name: string) {
  emit('patch', { [kind]: name })
  modal.value = null
}
</script>

<template>
  <section class="document-details billing-details" aria-label="ข้อมูลอ้างอิงและราคา">
    <div class="billing-details-row">
      <div class="billing-inline-field">
        <span class="field-label">โปรเจ็ค:</span>
        <AppDropdown
          label="เลือกโปรเจ็ค"
          :items="projects"
          wide
          class="form-input billing-catalog-trigger"
          @select="select('project', $event)"
        >
          <span class="truncate">{{ props.draft.project || 'เลือกโปรเจ็ค' }}</span>
          <AppIcon name="down" class="h-4 w-4" />
        </AppDropdown>
      </div>
      <FormField label="เลขที่อ้างอิง">
        <input
          :value="draft.reference"
          class="form-input"
          maxlength="100"
          @input="emit('patch', { reference: ($event.target as HTMLInputElement).value })"
        />
      </FormField>
      <FormField label="ราคาสินค้า">
        <select
          :value="draft.priceMode"
          class="form-input"
          @change="
            emit('patch', {
              priceMode: ($event.target as HTMLSelectElement).value as BillingDraft['priceMode'],
            })
          "
        >
          <option value="exclusive">ราคาไม่รวมภาษี</option>
          <option value="inclusive">ราคารวมภาษี</option>
        </select>
      </FormField>
    </div>
    <FormField label="รายละเอียด" class="billing-description mt-4">
      <input
        :value="draft.description"
        class="form-input"
        maxlength="1000"
        @input="emit('patch', { description: ($event.target as HTMLInputElement).value })"
      />
    </FormField>
    <div class="billing-inline-field mt-4 max-w-3xl">
      <span class="field-label">คลังสินค้า:</span>
      <AppDropdown
        label="เลือกคลังสินค้า"
        :items="warehouses"
        wide
        class="form-input billing-catalog-trigger"
        @select="select('warehouse', $event)"
      >
        <span class="truncate">{{ draft.warehouse }}</span>
        <AppIcon name="down" class="h-4 w-4" />
      </AppDropdown>
    </div>
    <BillingProjectDialog
      v-if="modal === 'project'"
      :customer="draft.customer.name"
      @close="modal = null"
      @saved="created('project', $event)"
    />
    <BillingWarehouseDialog
      v-if="modal === 'warehouse'"
      @close="modal = null"
      @saved="created('warehouse', $event)"
    />
  </section>
</template>
