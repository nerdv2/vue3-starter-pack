<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
</script>

<template>
  <div class="not-found">
    <div class="card not-found__card">
      <p class="not-found__code">404</p>
      <h1>Page not found</h1>
      <p class="muted">The page you are looking for does not exist or has moved.</p>
      <RouterLink :to="{ name: 'dashboard' }">
        <AppButton>Back to dashboard</AppButton>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.not-found__card {
  max-width: 380px;
  width: 100%;
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.not-found__code {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}
</style>
