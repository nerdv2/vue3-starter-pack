<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import { customersApi } from '@/api/customers'
import type { Customer, CustomerPayload } from '@/api/types'
import AppButton from '@/components/AppButton.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppModal from '@/components/AppModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import CustomerAvatar from '@/components/CustomerAvatar.vue'
import CustomerForm from '@/components/CustomerForm.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { errorFields, errorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const customer = ref<Customer | null>(null)
const loading = ref(true)
const notFound = ref(false)
const uploadingAvatar = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const formOpen = ref(false)
const submitting = ref(false)
const formErrors = ref<Record<string, string>>({})

const deleteOpen = ref(false)
const deleteLoading = ref(false)

const customerId = computed(() => Number(route.params.id))

onMounted(async () => {
  await load()
})

async function load(): Promise<void> {
  loading.value = true
  notFound.value = false

  try {
    customer.value = (await customersApi.get(customerId.value)).data
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound.value = true
    } else {
      toast.error(errorMessage(error, 'Could not load the customer.'))
    }
  } finally {
    loading.value = false
  }
}

async function onAvatarSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Avatar must not exceed 2 MB.')

    return
  }

  uploadingAvatar.value = true
  try {
    customer.value = (await customersApi.uploadAvatar(customerId.value, file)).data
    toast.success('Avatar updated.')
  } catch (error) {
    toast.error(errorMessage(error, 'Could not upload the avatar.'))
  } finally {
    uploadingAvatar.value = false
  }
}

async function removeAvatar(): Promise<void> {
  uploadingAvatar.value = true
  try {
    customer.value = (await customersApi.removeAvatar(customerId.value)).data
    toast.success('Avatar removed.')
  } catch (error) {
    toast.error(errorMessage(error, 'Could not remove the avatar.'))
  } finally {
    uploadingAvatar.value = false
  }
}

async function submitForm(payload: CustomerPayload): Promise<void> {
  submitting.value = true
  formErrors.value = {}

  try {
    customer.value = (await customersApi.update(customerId.value, payload)).data
    formOpen.value = false
    toast.success('Customer updated.')
  } catch (error) {
    formErrors.value = errorFields(error)
    toast.error(errorMessage(error, 'Could not save the customer.'))
  } finally {
    submitting.value = false
  }
}

async function confirmDelete(): Promise<void> {
  deleteLoading.value = true
  try {
    await customersApi.remove(customerId.value)
    toast.success('Customer deleted.')
    await router.push({ name: 'customers' })
  } catch (error) {
    toast.error(errorMessage(error, 'Could not delete the customer.'))
  } finally {
    deleteLoading.value = false
  }
}

function openEditForm(): void {
  formErrors.value = {}
  formOpen.value = true
}
</script>

<template>
  <div class="stack">
    <RouterLink :to="{ name: 'customers' }" class="back">← Back to customers</RouterLink>

    <div v-if="loading" class="card">
      <div class="card__body muted">Loading customer…</div>
    </div>

    <AppEmptyState
      v-else-if="notFound || customer === null"
      title="Customer not found"
      description="The record may have been deleted."
    >
      <template #action>
        <RouterLink :to="{ name: 'customers' }">
          <AppButton>Back to customers</AppButton>
        </RouterLink>
      </template>
    </AppEmptyState>

    <template v-else>
      <section class="card profile">
        <div class="profile__avatar">
          <CustomerAvatar :name="customer.name" :src="customer.avatar_url" :size="88" />
          <div v-if="auth.isAdmin" class="profile__avatar-actions">
            <AppButton
              size="sm"
              variant="secondary"
              :loading="uploadingAvatar"
              @click="fileInput?.click()"
            >
              Change photo
            </AppButton>
            <AppButton
              v-if="customer.avatar_url"
              size="sm"
              variant="ghost"
              :disabled="uploadingAvatar"
              @click="removeAvatar"
            >
              Remove
            </AppButton>
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="sr-only"
              @change="onAvatarSelected"
            />
          </div>
        </div>

        <div class="profile__body">
          <div class="row row--wrap">
            <h1>{{ customer.name }}</h1>
            <StatusBadge :status="customer.status" />
          </div>
          <p class="muted">{{ customer.company ?? 'No company' }}</p>
          <div class="profile__contacts">
            <a v-if="customer.email" :href="`mailto:${customer.email}`">{{ customer.email }}</a>
            <span v-else class="subtle">No email</span>
            <span v-if="customer.phone">{{ customer.phone }}</span>
          </div>
        </div>

        <div v-if="auth.isAdmin" class="profile__actions">
          <AppButton variant="secondary" @click="openEditForm">Edit</AppButton>
          <AppButton variant="ghost" class="danger-link" @click="deleteOpen = true"
            >Delete</AppButton
          >
        </div>
      </section>

      <div class="split">
        <section class="card">
          <header class="card__header"><h2>Details</h2></header>
          <dl class="details">
            <div>
              <dt>Company</dt>
              <dd>{{ customer.company ?? '—' }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ customer.email ?? '—' }}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{{ customer.phone ?? '—' }}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{{ formatDate(customer.created_at, true) }}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{{ formatDate(customer.updated_at, true) }}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{{ customer.address ?? '—' }}</dd>
            </div>
          </dl>
        </section>

        <section class="card">
          <header class="card__header"><h2>Notes</h2></header>
          <div class="card__body">
            <p v-if="customer.notes" class="notes">{{ customer.notes }}</p>
            <p v-else class="subtle">No notes yet.</p>
          </div>
        </section>
      </div>
    </template>

    <AppModal :open="formOpen" title="Edit customer" size="lg" @close="formOpen = false">
      <CustomerForm
        :customer="customer"
        :submitting="submitting"
        :errors="formErrors"
        @submit="submitForm"
        @cancel="formOpen = false"
      />
    </AppModal>

    <ConfirmDialog
      :open="deleteOpen"
      title="Delete customer"
      :message="`Delete ${customer?.name ?? 'this customer'}? The record is soft-deleted and disappears from lists.`"
      confirm-label="Delete"
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
    />
  </div>
</template>

<style scoped>
.back {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.back:hover {
  color: var(--primary);
}

.profile {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 1.5rem;
  flex-wrap: wrap;
}

.profile__avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.profile__avatar-actions {
  display: flex;
  gap: 0.35rem;
}

.profile__body {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.profile__contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  font-size: 0.9rem;
}

.profile__actions {
  display: flex;
  gap: 0.5rem;
}

.split {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.details {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.details div {
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.details div:nth-child(odd) {
  border-right: 1px solid var(--border);
}

.details dt {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
}

.details dd {
  margin: 0.2rem 0 0;
}

.notes {
  white-space: pre-wrap;
}

:deep(.danger-link) {
  color: var(--danger);
}

@media (max-width: 900px) {
  .split {
    grid-template-columns: 1fr;
  }

  .details {
    grid-template-columns: 1fr;
  }

  .details div:nth-child(odd) {
    border-right: 0;
  }
}
</style>
