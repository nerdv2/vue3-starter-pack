<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="empty">
    <div class="empty__mark" aria-hidden="true">
      <slot name="icon">◌</slot>
    </div>
    <h3>{{ title }}</h3>
    <p v-if="description" class="muted">{{ description }}</p>
    <div v-if="$slots.action" class="empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  padding: 3rem 1.5rem;
}

.empty__mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  color: var(--text-subtle);
  font-size: 1.2rem;
}

.empty__action {
  margin-top: 0.6rem;
}
</style>
