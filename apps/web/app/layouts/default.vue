<script setup lang="ts">
import SalesNavigation from '~/components/layout/SalesNavigation.vue'
</script>

<template>
  <div class="sales-app">
    <SalesNavigation />
    <div class="sales-workspace">
      <div class="workspace-banner">
        <span class="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
        พื้นที่ทดลองใช้งาน
        <span class="mx-3 text-slate-300">|</span>
        ข้อมูลตัวอย่าง บันทึกในเบราว์เซอร์นี้
      </div>
      <main class="workspace-content"><slot /></main>
      <footer class="px-6 pb-5 text-right text-[11px] text-slate-400">
        Mind Count · จัดการเอกสารได้ง่ายขึ้น
      </footer>
    </div>
  </div>
</template>
