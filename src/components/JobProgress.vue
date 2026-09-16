<script setup lang="ts">
import { computed } from 'vue'
import type { Job } from '@/api/types'

const props = defineProps<{ job: Job }>()

const TONES: Record<Job['status'], string> = {
  pending: 'neutral',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  cancelled: 'neutral',
}

const tone = computed(() => TONES[props.job.status])

const percent = computed(() => {
  if (props.job.progress !== null) {
    return Math.min(100, Math.max(0, props.job.progress))
  }

  return props.job.status === 'completed' ? 100 : null
})

const message = computed(() => {
  if (props.job.error_message) {
    return props.job.error_message
  }

  return props.job.progress_message ?? 'Waiting for the worker…'
})
</script>

<template>
  <div class="job">
    <div class="job__head">
      <span class="badge" :class="`badge--${tone}`">{{ job.status }}</span>
      <span class="job__message">{{ message }}</span>
      <span class="spacer" />
      <span class="subtle job__id">#{{ job.id }}</span>
    </div>
    <div
      class="job__bar"
      :class="{ 'job__bar--indeterminate': percent === null && job.status === 'running' }"
      role="progressbar"
      :aria-valuenow="percent ?? undefined"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span :style="percent === null ? undefined : { width: `${percent}%` }" />
    </div>
  </div>
</template>

<style scoped>
.job {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem 0;
}

.job__head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.job__message {
  color: var(--text-muted);
  font-size: 0.88rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job__id {
  font-size: 0.8rem;
}

.job__bar {
  height: 6px;
  border-radius: 999px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  overflow: hidden;
}

.job__bar span {
  display: block;
  height: 100%;
  background: var(--primary);
  border-radius: inherit;
  transition: width 0.4s ease;
}

.job__bar--indeterminate span {
  width: 40%;
  animation: job-slide 1.2s ease-in-out infinite;
}

@keyframes job-slide {
  0% {
    margin-left: -40%;
  }

  100% {
    margin-left: 100%;
  }
}
</style>
