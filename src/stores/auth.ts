import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import { refreshSession, setAccessToken } from '@/api/client'
import type { AuthSession, ChangePasswordPayload, RegisterPayload, User } from '@/api/types'

async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await authApi.changePassword(payload)
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  let initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.type === 'admin')
  const displayName = computed(() => user.value?.name ?? '')

  const initials = computed(() => {
    const name = user.value?.name.trim() ?? ''
    if (name === '') {
      return '?'
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  })

  /**
   * Restore the session on boot: the refresh cookie mints a new access token
   * and the profile request fills the store. Safe to call repeatedly;
   * concurrent callers share one bootstrap.
   */
  function init(): Promise<void> {
    if (initialized.value) {
      return Promise.resolve()
    }

    initPromise ??= (async () => {
      if (await refreshSession()) {
        try {
          user.value = (await authApi.me()).data
        } catch {
          user.value = null
        }
      }

      initialized.value = true
    })()

    return initPromise
  }

  async function login(email: string, password: string): Promise<void> {
    loading.value = true
    try {
      applySession((await authApi.login({ email, password })).data)
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload): Promise<void> {
    loading.value = true
    try {
      applySession((await authApi.register(payload)).data)
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout()
    } catch {
      // The session may already be gone; clearing locally is enough.
    } finally {
      clear()
    }
  }

  async function updateProfile(name: string): Promise<void> {
    user.value = (await authApi.updateProfile({ name })).data
  }

  function applySession(session: AuthSession): void {
    setAccessToken(session.access_token)
    user.value = session.user
  }

  function clear(): void {
    setAccessToken(null)
    user.value = null
  }

  return {
    user,
    initialized,
    loading,
    isAuthenticated,
    isAdmin,
    displayName,
    initials,
    init,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clear,
  }
})
