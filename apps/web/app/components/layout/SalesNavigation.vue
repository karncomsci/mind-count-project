<script setup lang="ts">
import AppIcon from '../base/AppIcon.vue'
import { salesDocuments } from '~/constants/sales-navigation'
const open = ref(false)
const expanded = ref(true)
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
</script>

<template>
  <div class="sales-navigation print:hidden" :inert="!ready">
    <div class="mobile-nav">
      <NuxtLink to="/sales/quotations" class="font-semibold text-sky-600">
        mind
        <span class="font-normal text-slate-400">count</span>
      </NuxtLink>
      <button
        class="icon-button"
        aria-label="เปิดเมนูเอกสารการขาย"
        :aria-expanded="open"
        :disabled="!ready"
        @click="open = !open"
      >
        <AppIcon :name="open ? 'close' : 'menu'" />
      </button>
    </div>
    <button
      v-if="open"
      class="fixed inset-0 z-30 bg-slate-900/25 lg:hidden"
      aria-label="ปิดเมนู"
      @click="open = false"
    />
    <aside class="sales-sidebar" :class="{ 'is-open': open }" aria-label="เมนูหลัก">
      <div class="icon-rail">
        <NuxtLink to="/" class="rail-logo" aria-label="Mind Count หน้าหลัก">
          <AppIcon name="chart" />
        </NuxtLink>
        <span class="rail-icon opacity-55" title="ภาพรวมบริษัท"><AppIcon name="building" /></span>
        <NuxtLink to="/sales/quotations" class="rail-icon rail-active" aria-label="เอกสารการขาย">
          <AppIcon name="sales" />
        </NuxtLink>
        <div class="mt-auto mb-6 opacity-70"><AppIcon name="settings" /></div>
      </div>
      <div class="side-panel">
        <NuxtLink to="/" class="brand-wordmark">
          mind
          <span>count</span>
          <span class="brand-dot">.</span>
        </NuxtLink>
        <p class="px-6 pt-7 pb-3 text-[11px] font-semibold tracking-[.14em] text-slate-400">
          WORKSPACE
        </p>
        <button
          class="flex w-full items-center justify-between px-6 py-3 text-left font-semibold text-slate-600"
          :aria-expanded="expanded"
          aria-controls="sales-submenu"
          @click="expanded = !expanded"
        >
          เอกสารการขาย
          <AppIcon
            name="down"
            class="h-4 w-4 transition-transform"
            :class="{ '-rotate-90': !expanded }"
          />
        </button>
        <nav
          v-show="expanded"
          id="sales-submenu"
          aria-label="เอกสารการขาย"
          class="min-h-0 overflow-y-auto pb-5"
        >
          <NuxtLink
            v-for="document in salesDocuments"
            :key="document.slug"
            :to="`/sales/${document.slug}`"
            class="sales-nav-link"
            :class="{
              'is-active': route.path.startsWith(`/sales/${document.slug}`),
              'mt-4': ['cash-sales', 'credit-notes'].includes(document.slug),
            }"
            :aria-current="route.path.startsWith(`/sales/${document.slug}`) ? 'page' : undefined"
          >
            <AppIcon name="document" />
            {{ document.label }}
            <span
              v-if="route.path.startsWith(`/sales/${document.slug}`)"
              class="ml-auto h-1.5 w-1.5 rounded-full bg-sky-500"
            />
          </NuxtLink>
        </nav>
        <div class="company-card">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sky-600 shadow-sm"
          >
            <AppIcon name="building" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-600">บริษัทของคุณ</p>
            <p class="mt-1 text-[10px] text-slate-400">พื้นที่ทดลองใช้งาน</p>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
