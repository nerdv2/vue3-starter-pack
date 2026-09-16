<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
})

const errors = ref<Record<string, string>>({})

function validate(): boolean {
  const next: Record<string, string> = {}

  if (form.name.trim() === '') {
    next.name = 'Name is required.'
  }
  if (form.email.trim() === '') {
    next.email = 'Email is required.'
  }
  if (form.password.length < 8) {
    next.password = 'Password must be at least 8 characters.'
  }
  if (form.password !== form.passwordConfirmation) {
    next.password_confirmation = 'Password confirmation does not match.'
  }

  errors.value = next

  return Object.keys(next).length === 0
}

async function submit(): Promise<void> {
  if (!validate()) {
    return
  }

  try {
    await auth.register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      password_confirmation: form.passwordConfirmation,
    })
    toast.success('Account created. Welcome aboard.')
    await router.push({ name: 'dashboard' })
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.fieldErrors
      toast.error(error.message)
    } else {
      toast.error('Registration failed. Please try again.')
    }
  }
}
</script>

<template>
  <AuthLayout
    title="Create your account"
    subtitle="New accounts get the staff role: they can browse customers and export data."
  >
    <form class="stack" novalidate @submit.prevent="submit">
      <AppInput
        v-model="form.name"
        label="Name"
        autocomplete="name"
        placeholder="Jane Doe"
        required
        :error="errors.name"
      />
      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
        :error="errors.email"
      />
      <AppInput
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="new-password"
        hint="At least 8 characters."
        required
        :error="errors.password"
      />
      <AppInput
        v-model="form.passwordConfirmation"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        required
        :error="errors.password_confirmation"
      />
      <AppButton type="submit" block :loading="auth.loading">Create account</AppButton>
    </form>
    <p class="muted auth-link">
      Already registered?
      <RouterLink :to="{ name: 'login' }">Sign in</RouterLink>
    </p>
  </AuthLayout>
</template>

<style scoped>
.auth-link {
  text-align: center;
  font-size: 0.9rem;
}
</style>
