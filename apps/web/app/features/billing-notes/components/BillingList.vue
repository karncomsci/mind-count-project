<script setup lang="ts">
import AppIcon from '~/components/base/AppIcon.vue'
import { calculateTotals, formatDate, formatMoney } from '../../quotations/model'
import { useBillingNotesStore } from '../stores/billing-notes'
const store = useBillingNotesStore()
const route = useRoute()
const search = ref('')
onMounted(() => store.hydrate())
const records = computed(() =>
  store.state.records.filter((item) =>
    `${item.number} ${item.draft.customer.name} ${item.draft.project}`
      .toLocaleLowerCase()
      .includes(search.value.trim().toLocaleLowerCase()),
  ),
)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <p class="eyebrow">เอกสารการขาย / ใบวางบิล</p>
        <h1>ใบวางบิล</h1>
        <p class="mt-2 text-sm text-slate-500">จัดการเอกสารและติดตามยอดเรียกเก็บจากลูกค้า</p>
      </div>
      <NuxtLink to="/sales/billing-notes/new" class="button button-green">
        <AppIcon name="plus" class="h-4 w-4" />
        สร้างใบวางบิล
      </NuxtLink>
    </div>
    <p v-if="store.warning" role="alert" class="warning-notice">{{ store.warning }}</p>
    <p v-if="route.query.saved" role="status" class="success-notice">
      <AppIcon name="check" />
      บันทึกใบวางบิล {{ route.query.saved }} เรียบร้อยแล้ว
    </p>
    <div class="list-card">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
        <span class="text-sm text-slate-500">
          เอกสารทั้งหมด {{ store.state.records.length }} รายการ
        </span>
        <input
          v-model="search"
          class="form-input max-w-sm"
          aria-label="ค้นหาใบวางบิล"
          placeholder="ค้นหาเลขเอกสาร ลูกค้า หรือโปรเจ็ค"
        />
      </div>
      <div v-if="!store.ready" class="empty-state">กำลังโหลดใบวางบิล…</div>
      <div v-else-if="!records.length" class="empty-state">
        <AppIcon name="document" class="mb-4 h-12 w-12 text-slate-300" />
        <p>{{ search ? 'ไม่พบใบวางบิลที่ตรงกับคำค้นหา' : 'ยังไม่มีใบวางบิล' }}</p>
        <p class="mt-2 text-sm text-slate-400">
          {{ search ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มสร้างใบวางบิลฉบับแรกของคุณ' }}
        </p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="billing-list-table">
          <thead>
            <tr>
              <th>วันที่ / เลขที่เอกสาร</th>
              <th>ลูกค้า</th>
              <th>โปรเจ็ค</th>
              <th class="text-right">ยอดชำระ (บาท)</th>
              <th>ครบกำหนด</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in records" :key="record.id">
              <td>
                <NuxtLink :to="`/sales/billing-notes/${record.id}`" class="document-link">
                  {{ record.number }}
                </NuxtLink>
                <p class="mt-1 text-xs text-slate-400">{{ formatDate(record.draft.date) }}</p>
              </td>
              <td>{{ record.draft.customer.name }}</td>
              <td>{{ record.draft.project || '—' }}</td>
              <td class="text-right tabular-nums">
                {{ formatMoney(calculateTotals(record.draft).payable) }}
              </td>
              <td>
                {{
                  record.draft.creditMode === 'days'
                    ? formatDate(record.draft.dueDate)
                    : record.draft.creditMode === 'cash'
                      ? 'เงินสด'
                      : 'ไม่ระบุวันที่'
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <p class="mt-4 text-xs text-slate-400">เอกสารตัวอย่าง · ข้อมูลเก็บในเบราว์เซอร์นี้</p>
  </section>
</template>
