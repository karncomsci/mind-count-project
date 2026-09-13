<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <main class="mx-auto max-w-xl px-6 py-20">
    <h1 class="text-2xl font-semibold">{{ error.statusCode === 404 ? 'ไม่พบหน้าที่ต้องการ' : 'ไม่สามารถแสดงหน้านี้ได้' }}</h1>
    <button class="mt-6 rounded-lg bg-teal-700 px-5 py-3 text-white" @click="clearError({ redirect: '/' })">กลับหน้าหลัก</button>
  </main>
</template>
