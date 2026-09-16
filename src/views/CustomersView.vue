<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { customersApi } from '@/api/customers'
import {
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_LABELS,
  type Customer,
  type CustomerPayload,
  type CustomerStatus,
} from '@/api/types'
import AppButton from '@/components/AppButton.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppInput from '@/components/AppInput.vue'
import AppModal from '@/components/AppModal.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSelect from '@/components/AppSelect.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import CustomerAvatar from '@/components/CustomerAvatar.vue'
import CustomerForm from '@/components/CustomerForm.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { errorFields, errorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/format'

const PAGE_SIZE = 10

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const customers = ref<Customer[]>([])
const totalData = ref(0)
const totalPage = ref(0)
const page = ref(1)
const status = ref<CustomerStatus | ''>(initialStatus())
const keywords = ref(typeof route.query.keywords === 'string' ? route.query.keywords : '')
const debouncedKeywords = useDebouncedRef(keywords, 350)
const loading = ref(true)

const formOpen = ref(false)
const editing = ref<Customer | null>(null)
const submitting = ref(false)
const formErrors = ref<Record<string, string>>({})

const deleting = ref<Customer | null>(null)
const deleteLoading = ref(false)

const statusOptions = computed(() => [
  { value: '', label: 'All statuses' },
  ...CUSTOMER_STATUSES.map((value) => ({ value, label: CUSTOMER_STATUS_LABELS[value] })),
])

function initialStatus(): CustomerStatus | '' {
  const value = route.query.status
  if (typeof value === 'string' && (CUSTOMER_STATUSES as readonly string[]).includes(value)) {
    return value as CustomerStatus
  }

  return ''
}

async function load(): Promise<void> {
  loading.value = true
  try {
    const response = await customersApi.list({
      page: page.value,
      limit: PAGE_SIZE,
      keywords: debouncedKeywords.value,
      status: status.value,
    })
    customers.value = response.data
    totalData.value = response.total_data ?? 0
    totalPage.value = response.total_page ?? 0
  } catch (error) {
    toast.error(errorMessage(error, 'Could not load customers.'))
  } finally {
    loading.value = false
  }
}

watch([debouncedKeywords, status], () => {
  if (page.value !== 1) {
    page.value = 1
  } else {
    void load()
  }
})

watch(page, () => void load())

onMounted(() => {
  if (route.query.new === '1' && auth.isAdmin) {
    openCreate()
  }
  void load()
})

function openCreate(): void {
  editing.value = null
  formErrors.value = {}
  formOpen.value = true
}

function openEdit(customer: Customer): void {
  editing.value = customer
  formErrors.value = {}
  formOpen.value = true
}

async function submitForm(payload: CustomerPayload): Promise<void> {
  submitting.value = true
  formErrors.value = {}

  try {
    if (editing.value) {
      await customersApi.update(editing.value.id, payload)
      toast.success('Customer updated.')
    } else {
      await customersApi.create(payload)
      toast.success('Customer created.')
    }
    formOpen.value = false
    editing.value = null
    await load()
  } catch (error) {
    formErrors.value = errorFields(error)
    toast.error(errorMessage(error, 'Could not save the customer.'))
  } finally {
    submitting.value = false
  }
}

async function confirmDelete(): Promise<void> {
  if (!deleting.value) {
    return
  }

  deleteLoading.value = true
  try {
    await customersApi.remove(deleting.value.id)
    toast.success('Customer deleted.')
    deleting.value = null
    await load()
  } catch (error) {
    toast.error(errorMessage(error, 'Could not delete the customer.'))
  } finally {
    deleteLoading.value = false
  }
}

function openDetail(customer: Customer): void {
  void router.push({ name: 'customer-detail', params: { id: customer.id } })
}
</script>

<template>
  <div class="stack">
    <div class="page-header">
      <div class="page-title">
        <h1>Customers</h1>
        <p class="muted">Search, filter and manage every customer record.</p>
      </div>
      <AppButton v-if="auth.isAdmin" @click="openCreate">New customer</AppButton>
    </div>

    <div class="card toolbar">
      <AppInput
        v-model="keywords"
        class="toolbar__search"
        placeholder="Search name, email or company…"
        label="Search"
      />
      <AppSelect v-model="status" label="Status" :options="statusOptions" />
    </div>

    <div class="card">
      <div v-if="loading && customers.length === 0" class="card__body muted">
        Loading customers…
      </div>

      <AppEmptyState
        v-else-if="customers.length === 0"
        title="No customers found"
        :description="
          keywords !== '' || status !== ''
            ? 'Try a different search or status filter.'
            : 'Create your first customer to get started.'
        "
      >
        <template v-if="auth.isAdmin && keywords === '' && status === ''" #action>
          <AppButton @click="openCreate">New customer</AppButton>
        </template>
      </AppEmptyState>

      <template v-else>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Company</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Added</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="customer in customers" :key="customer.id">
                <td>
                  <div class="cell-main">
                    <CustomerAvatar :name="customer.name" :src="customer.avatar_url" :size="34" />
                    <div class="cell-stack">
                      <strong>{{ customer.name }}</strong>
                      <span>{{ customer.email ?? '—' }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ customer.company ?? '—' }}</td>
                <td><StatusBadge :status="customer.status" /></td>
                <td>{{ customer.phone ?? '—' }}</td>
                <td class="muted">{{ formatDate(customer.created_at) }}</td>
                <td>
                  <div class="row row--end">
                    <AppButton size="sm" variant="ghost" @click="openDetail(customer)"
                      >View</AppButton
                    >
                    <AppButton
                      v-if="auth.isAdmin"
                      size="sm"
                      variant="ghost"
                      @click="openEdit(customer)"
                    >
                      Edit
                    </AppButton>
                    <AppButton
                      v-if="auth.isAdmin"
                      size="sm"
                      variant="ghost"
                      class="danger-link"
                      @click="deleting = customer"
                    >
                      Delete
                    </AppButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <AppPagination v-model:page="page" :total-pages="totalPage" :total-items="totalData" />
      </template>
    </div>

    <AppModal
      :open="formOpen"
      :title="editing ? 'Edit customer' : 'New customer'"
      size="lg"
      @close="formOpen = false"
    >
      <CustomerForm
        :customer="editing"
        :submitting="submitting"
        :errors="formErrors"
        @submit="submitForm"
        @cancel="formOpen = false"
      />
    </AppModal>

    <ConfirmDialog
      :open="deleting !== null"
      title="Delete customer"
      :message="`Delete ${deleting?.name ?? 'this customer'}? The record is soft-deleted and disappears from lists.`"
      confirm-label="Delete"
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="deleting = null"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 1rem;
  padding: 1rem 1.25rem;
}

@media (max-width: 700px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
}

.row--end {
  justify-content: flex-end;
}

:deep(.table .danger-link) {
  color: var(--danger);
}
</style>
