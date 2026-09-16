<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { customersApi } from '@/api/customers'
import { CUSTOMER_STATUSES, type Customer, type CustomerStats } from '@/api/types'
import AppButton from '@/components/AppButton.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import CustomerAvatar from '@/components/CustomerAvatar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { errorMessage } from '@/utils/errors'
import { formatDate, formatNumber } from '@/utils/format'

const auth = useAuthStore()
const toast = useToastStore()

const stats = ref<CustomerStats | null>(null)
const recent = ref<Customer[]>([])
const loading = ref(true)

const cards = computed(() => [
  { label: 'Total customers', value: stats.value?.total ?? 0 },
  { label: 'Active', value: stats.value?.by_status.active ?? 0 },
  { label: 'Prospects', value: stats.value?.by_status.prospect ?? 0 },
  { label: 'New in 7 days', value: stats.value?.created_last_7_days ?? 0 },
])

const pipeline = computed(() => {
  const total = stats.value?.total ?? 0

  return CUSTOMER_STATUSES.map((status) => {
    const count = stats.value?.by_status[status] ?? 0

    return {
      status,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })
})

onMounted(async () => {
  try {
    const [statsResponse, listResponse] = await Promise.all([
      customersApi.stats(),
      customersApi.list({ page: 1, limit: 5 }),
    ])
    stats.value = statsResponse.data
    recent.value = listResponse.data
  } catch (error) {
    toast.error(errorMessage(error, 'Could not load the dashboard.'))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="stack">
    <div class="page-header">
      <div class="page-title">
        <h1>Welcome back, {{ auth.displayName }}</h1>
        <p class="muted">A quick look at your customer base.</p>
      </div>
      <div class="row">
        <RouterLink v-if="auth.isAdmin" :to="{ name: 'customers', query: { new: '1' } }">
          <AppButton>New customer</AppButton>
        </RouterLink>
        <RouterLink :to="{ name: 'transfer' }">
          <AppButton variant="secondary">Import / export</AppButton>
        </RouterLink>
      </div>
    </div>

    <div class="stat-grid">
      <div v-for="card in cards" :key="card.label" class="card stat">
        <span class="muted">{{ card.label }}</span>
        <strong>{{ loading ? '—' : formatNumber(card.value) }}</strong>
      </div>
    </div>

    <div class="split">
      <section class="card">
        <header class="card__header">
          <h2>Pipeline</h2>
          <span class="muted">{{ formatNumber(stats?.total ?? 0) }} total</span>
        </header>
        <div class="card__body stack">
          <div v-for="row in pipeline" :key="row.status" class="pipeline">
            <div class="pipeline__head">
              <StatusBadge :status="row.status" />
              <span class="spacer" />
              <span class="muted">{{ formatNumber(row.count) }} · {{ row.percent }}%</span>
            </div>
            <div class="pipeline__bar">
              <span :style="{ width: `${row.percent}%` }" />
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <header class="card__header">
          <h2>Recently added</h2>
          <RouterLink :to="{ name: 'customers' }">View all</RouterLink>
        </header>
        <div v-if="recent.length === 0 && !loading">
          <AppEmptyState
            title="No customers yet"
            description="Create the first customer to get started."
          />
        </div>
        <ul v-else class="recent">
          <li v-for="customer in recent" :key="customer.id">
            <RouterLink
              :to="{ name: 'customer-detail', params: { id: customer.id } }"
              class="recent__link"
            >
              <CustomerAvatar :name="customer.name" :src="customer.avatar_url" :size="34" />
              <span class="recent__meta">
                <strong>{{ customer.name }}</strong>
                <span class="muted">{{ customer.company ?? customer.email ?? '—' }}</span>
              </span>
              <StatusBadge :status="customer.status" />
            </RouterLink>
            <span class="muted recent__date">{{ formatDate(customer.created_at) }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.stat {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.stat strong {
  font-size: 1.6rem;
  letter-spacing: -0.02em;
}

.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 1rem;
  align-items: start;
}

.pipeline {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.pipeline__head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
}

.pipeline__bar {
  height: 6px;
  border-radius: 999px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  overflow: hidden;
}

.pipeline__bar span {
  display: block;
  height: 100%;
  background: var(--primary);
  transition: width 0.4s ease;
}

.recent {
  list-style: none;
  margin: 0;
  padding: 0;
}

.recent li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.recent li:last-child {
  border-bottom: 0;
}

.recent__link {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex: 1;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.recent__link:hover {
  text-decoration: none;
}

.recent__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}

.recent__meta strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent__meta .muted {
  font-size: 0.82rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent__date {
  font-size: 0.82rem;
}

@media (max-width: 1000px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .split {
    grid-template-columns: 1fr;
  }
}
</style>
