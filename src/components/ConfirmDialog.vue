<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppModal from './AppModal.vue'

withDefaults(
  defineProps<{
    open: boolean
    message: string
    title?: string
    confirmLabel?: string
    loading?: boolean
  }>(),
  { title: 'Please confirm', confirmLabel: 'Confirm', loading: false },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <AppModal :open="open" :title="title" size="sm" @close="emit('cancel')">
    <p class="muted">{{ message }}</p>
    <template #footer>
      <AppButton variant="secondary" :disabled="loading" @click="emit('cancel')">Cancel</AppButton>
      <AppButton variant="danger" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>
