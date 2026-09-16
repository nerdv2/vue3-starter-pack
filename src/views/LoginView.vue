<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const errors = ref<Record<string, string>>({})

async function submit(): Promise<void> {
  errors.value = {}

  try {
    await auth.login(form.email, form.password)
    toast.success('Welcome back.')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    await router.push(redirect ?? { name: 'dashboard' })
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.fieldErrors
      toast.error(error.message)
    } else {
      toast.error('Sign in failed. Please try again.')
    }
  }
}
</script>

<template>
  <AuthLayout title="Sign in" subtitle="Use your account to manage customers.">
    <form class="stack" novalidate @submit.prevent="submit">
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
        autocomplete="current-password"
        required
        :error="errors.password"
      />
      <AppButton type="submit" block :loading="auth.loading">Sign in</AppButton>
    </form>
    <p class="muted auth-link">
      No account yet?
      <RouterLink :to="{ name: 'register' }">Create one</RouterLink>
    </p>
  </AuthLayout>
</template>

<style scoped>
.auth-link {
  text-align: center;
  font-size: 0.9rem;
}
</style>
