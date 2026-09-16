<script setup lang="ts">
import { computed } from 'vue'
import AppButton from './AppButton.vue'

const props = defineProps<{
  page: number
  totalPages: number
  totalItems?: number
}>()

const emit = defineEmits<{ 'update:page': [page: number] }>()

const canPrev = computed(() => props.page > 1)
const canNext = computed(() => props.page < props.totalPages)
</script>

<template>
  <div class="pagination">
    <span class="muted pagination__info">
      {{ totalItems ?? 0 }} {{ totalItems === 1 ? 'record' : 'records' }}
    </span>
    <div class="row">
      <AppButton
        size="sm"
        variant="secondary"
        :disabled="!canPrev"
        @click="emit('update:page', page - 1)"
      >
        Previous
      </AppButton>
      <span class="muted pagination__page">Page {{ page }}</span>
      <AppButton
        size="sm"
        variant="secondary"
        :disabled="!canNext"
        @click="emit('update:page', page + 1)"
      >
        Next
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

.pagination__page {
  font-size: 0.85rem;
  min-width: 5rem;
  text-align: center;
}
</style>
