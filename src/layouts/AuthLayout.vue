<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="auth">
    <div class="auth__card card">
      <div class="auth__brand">
        <img src="/favicon.svg" alt="" width="36" height="36" />
        <div>
          <strong>Customer DB</strong>
          <p class="muted">Customer management for small teams</p>
        </div>
      </div>
      <div class="auth__heading">
        <h1>{{ title }}</h1>
        <p v-if="subtitle" class="muted">{{ subtitle }}</p>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background:
    radial-gradient(1000px 500px at 15% -10%, var(--primary-soft), transparent 60%), var(--bg);
}

.auth__card {
  width: 100%;
  max-width: 420px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.auth__brand p {
  font-size: 0.82rem;
}

.auth__heading h1 {
  font-size: 1.3rem;
}

.auth__heading p {
  font-size: 0.9rem;
  margin-top: 0.15rem;
}
</style>
