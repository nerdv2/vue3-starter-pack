<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import AppButton from './AppButton.vue'
import AppInput from './AppInput.vue'
import AppSelect from './AppSelect.vue'
import AppTextarea from './AppTextarea.vue'
import {
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_LABELS,
  type Customer,
  type CustomerPayload,
  type CustomerStatus,
} from '@/api/types'

const props = withDefaults(
  defineProps<{
    customer?: Customer | null
    submitting?: boolean
    errors?: Record<string, string>
  }>(),
  { customer: null, submitting: false, errors: () => ({}) },
)

const emit = defineEmits<{ submit: [payload: CustomerPayload]; cancel: [] }>()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'lead' as CustomerStatus,
  address: '',
  notes: '',
})

const localErrors = reactive<Record<string, string>>({})

watch(
  () => props.customer,
  (customer) => {
    form.name = customer?.name ?? ''
    form.email = customer?.email ?? ''
    form.phone = customer?.phone ?? ''
    form.company = customer?.company ?? ''
    form.status = customer?.status ?? 'lead'
    form.address = customer?.address ?? ''
    form.notes = customer?.notes ?? ''

    for (const key of Object.keys(localErrors)) {
      localErrors[key] = ''
    }
  },
  { immediate: true },
)

const statusOptions = computed(() =>
  CUSTOMER_STATUSES.map((status) => ({ value: status, label: CUSTOMER_STATUS_LABELS[status] })),
)

function fieldError(field: string): string {
  return localErrors[field] ?? props.errors[field] ?? ''
}

function validate(): boolean {
  localErrors.name = form.name.trim() === '' ? 'Name is required.' : ''

  const email = form.email.trim()
  localErrors.email =
    email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address.' : ''

  return Object.values(localErrors).every((message) => message === '')
}

function nullable(value: string): string | null {
  const trimmed = value.trim()

  return trimmed === '' ? null : trimmed
}

function submit(): void {
  if (!validate()) {
    return
  }

  emit('submit', {
    name: form.name.trim(),
    email: nullable(form.email),
    phone: nullable(form.phone),
    company: nullable(form.company),
    status: form.status,
    address: nullable(form.address),
    notes: nullable(form.notes),
  })
}
</script>

<template>
  <form class="form-grid" @submit.prevent="submit">
    <div class="span-2">
      <AppInput
        v-model="form.name"
        label="Name"
        placeholder="Customer or company name"
        required
        :error="fieldError('name')"
      />
    </div>
    <AppInput
      v-model="form.email"
      label="Email"
      type="email"
      placeholder="name@example.com"
      :error="fieldError('email')"
    />
    <AppInput v-model="form.phone" label="Phone" placeholder="+62 …" :error="fieldError('phone')" />
    <AppInput v-model="form.company" label="Company" :error="fieldError('company')" />
    <AppSelect
      v-model="form.status"
      label="Status"
      :options="statusOptions"
      :error="fieldError('status')"
    />
    <div class="span-2">
      <AppTextarea
        v-model="form.address"
        label="Address"
        :rows="2"
        :error="fieldError('address')"
      />
    </div>
    <div class="span-2">
      <AppTextarea v-model="form.notes" label="Notes" :rows="3" :error="fieldError('notes')" />
    </div>
    <div class="span-2 form-actions">
      <AppButton variant="secondary" :disabled="submitting" @click="emit('cancel')"
        >Cancel</AppButton
      >
      <AppButton type="submit" :loading="submitting">
        {{ customer ? 'Save changes' : 'Create customer' }}
      </AppButton>
    </div>
  </form>
</template>

<style scoped>
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.25rem;
}
</style>
