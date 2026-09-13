<script setup lang="ts">
import { QuotationEditor } from '~/features/quotations'
definePageMeta({ layout: 'document' })
const route = useRoute()
useHead({ title: 'แก้ไขใบเสนอราคา · Mind Count' })
</script>

<template>
  <QuotationEditor :key="String(route.params.id)" :record-id="String(route.params.id)" />
</template>
