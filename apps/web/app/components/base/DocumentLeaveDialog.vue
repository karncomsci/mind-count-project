<script setup lang="ts">
import AppDialog from './AppDialog.vue'
import AppIcon from './AppIcon.vue'
defineProps<{ busy: boolean }>()
defineEmits<{ cancel: []; discard: []; save: [] }>()
</script>
<template>
  <Teleport to="body">
    <AppDialog
      title="คุณต้องการบันทึกข้อมูลหรือไม่"
      class="document-leave-dialog"
      @close="!busy && $emit('cancel')"
    >
      <button
        type="button"
        class="absolute top-4 right-4 text-slate-400"
        aria-label="ปิดข้อความยืนยัน"
        :disabled="busy"
        @click="$emit('cancel')"
      >
        <AppIcon name="close" />
      </button>
      <p>มีข้อมูลที่ยังไม่ได้บันทึก</p>
      <template #actions>
        <button
          type="button"
          class="button button-white mr-auto"
          data-testid="page-change-cancel-btn"
          :disabled="busy"
          @click="$emit('cancel')"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          class="button button-blue"
          data-testid="pageChange-cancelSave-btn"
          :disabled="busy"
          @click="$emit('discard')"
        >
          ไม่บันทึกและปิด
        </button>
        <button
          type="button"
          class="button button-green"
          data-testid="pageChange-saveClose-btn"
          :disabled="busy"
          @click="$emit('save')"
        >
          {{ busy ? 'กำลังบันทึก…' : 'บันทึกและปิด' }}
        </button>
      </template>
    </AppDialog>
  </Teleport>
</template>
<style scoped>
.document-leave-dialog {
  width: 590px;
  padding-top: 30px;
}
</style>
