<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
</script>

<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toasts">
      <button
        v-for="item in toast.items"
        :key="item.id"
        type="button"
        class="toast"
        :class="`toast--${item.type}`"
        role="status"
        @click="toast.remove(item.id)"
      >
        {{ item.message }}
      </button>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
.toasts {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: min(360px, calc(100vw - 2rem));
}

.toast {
  text-align: left;
  border: 1px solid var(--border);
  border-left-width: 4px;
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-md);
  padding: 0.7rem 0.9rem;
  font-size: 0.9rem;
  color: var(--text);
  cursor: pointer;
}

.toast--success {
  border-left-color: var(--success);
}

.toast--error {
  border-left-color: var(--danger);
}

.toast--info {
  border-left-color: var(--info);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--transition),
    transform var(--transition);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
