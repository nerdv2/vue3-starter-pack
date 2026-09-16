<script setup lang="ts">
import { reactive, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { errorFields, errorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/format'

const auth = useAuthStore()
const toast = useToastStore()

const name = ref(auth.user?.name ?? '')
const profileSaving = ref(false)
const profileErrors = ref<Record<string, string>>({})

const password = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
})
const passwordSaving = ref(false)
const passwordErrors = ref<Record<string, string>>({})

async function saveProfile(): Promise<void> {
  profileSaving.value = true
  profileErrors.value = {}

  try {
    await auth.updateProfile(name.value.trim())
    toast.success('Profile updated.')
  } catch (error) {
    profileErrors.value = errorFields(error)
    toast.error(errorMessage(error, 'Could not update the profile.'))
  } finally {
    profileSaving.value = false
  }
}

async function changePassword(): Promise<void> {
  passwordErrors.value = {}

  if (password.new_password.length < 8) {
    passwordErrors.value = { new_password: 'New password must be at least 8 characters.' }

    return
  }
  if (password.new_password !== password.new_password_confirmation) {
    passwordErrors.value = { new_password_confirmation: 'Confirmation does not match.' }

    return
  }

  passwordSaving.value = true
  try {
    await auth.changePassword({ ...password })
    password.current_password = ''
    password.new_password = ''
    password.new_password_confirmation = ''
    toast.success('Password changed. Other sessions were signed out.')
  } catch (error) {
    passwordErrors.value = errorFields(error)
    toast.error(errorMessage(error, 'Could not change the password.'))
  } finally {
    passwordSaving.value = false
  }
}
</script>

<template>
  <div class="stack">
    <div class="page-header">
      <div class="page-title">
        <h1>Profile</h1>
        <p class="muted">Your account details and security settings.</p>
      </div>
      <span class="badge" :class="auth.isAdmin ? 'badge--info' : 'badge--neutral'">
        {{ auth.user?.type }}
      </span>
    </div>

    <div class="grid">
      <section class="card">
        <header class="card__header"><h2>Account</h2></header>
        <div class="card__body stack">
          <form class="stack" @submit.prevent="saveProfile">
            <AppInput v-model="name" label="Display name" required :error="profileErrors.name" />
            <div>
              <AppButton type="submit" :loading="profileSaving">Save profile</AppButton>
            </div>
          </form>
          <hr class="divider" />
          <dl class="meta">
            <div>
              <dt>Email</dt>
              <dd>{{ auth.user?.email }}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd class="role">{{ auth.user?.type }}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{{ formatDate(auth.user?.created_at) }}</dd>
            </div>
            <div>
              <dt>Last login</dt>
              <dd>{{ formatDate(auth.user?.last_login_at, true) }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section class="card">
        <header class="card__header"><h2>Change password</h2></header>
        <div class="card__body">
          <form class="stack" @submit.prevent="changePassword">
            <AppInput
              v-model="password.current_password"
              label="Current password"
              type="password"
              autocomplete="current-password"
              required
              :error="passwordErrors.current_password"
            />
            <AppInput
              v-model="password.new_password"
              label="New password"
              type="password"
              autocomplete="new-password"
              hint="At least 8 characters."
              required
              :error="passwordErrors.new_password"
            />
            <AppInput
              v-model="password.new_password_confirmation"
              label="Confirm new password"
              type="password"
              autocomplete="new-password"
              required
              :error="passwordErrors.new_password_confirmation"
            />
            <div>
              <AppButton type="submit" :loading="passwordSaving">Change password</AppButton>
            </div>
            <p class="subtle">
              Changing your password signs out every other device; this session stays signed in.
            </p>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  align-items: start;
}

.meta {
  margin: 0;
  display: grid;
  gap: 0.6rem;
}

.meta div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.meta dt {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.meta dd {
  margin: 0;
  font-weight: 550;
  text-align: right;
  overflow-wrap: anywhere;
}

.role {
  text-transform: capitalize;
}
</style>
