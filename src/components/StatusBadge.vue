<script setup lang="ts">
import { computed } from 'vue'
import { CUSTOMER_STATUS_LABELS, type CustomerStatus } from '@/api/types'

const props = defineProps<{ status: CustomerStatus }>()

const TONES: Record<CustomerStatus, string> = {
  lead: 'neutral',
  prospect: 'warning',
  active: 'success',
  inactive: 'danger',
}

const tone = computed(() => TONES[props.status])
</script>

<template>
  <span class="badge" :class="`badge--${tone}`">
    {{ CUSTOMER_STATUS_LABELS[status] }}
  </span>
</template>
