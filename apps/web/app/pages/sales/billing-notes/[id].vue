<script setup lang="ts">
import { BillingEditor } from '~/features/billing-notes'
definePageMeta({ layout: 'document' })
const route = useRoute()
useHead({ title: 'แก้ไขใบวางบิล · Mind Count' })
</script>
<template>
  <BillingEditor :key="String(route.params.id)" :record-id="String(route.params.id)" />
</template>
