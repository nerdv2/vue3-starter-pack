import { apiFetch } from './client'
import type {
  AuthSession,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  User,
} from './types'

const publicRequest = { auth: false } as const

export const authApi = {
  register(payload: RegisterPayload) {
    return apiFetch<AuthSession>('/auth/register', {
      method: 'POST',
      body: payload,
      ...publicRequest,
    })
  },

  login(payload: LoginPayload) {
    return apiFetch<AuthSession>('/auth/login', { method: 'POST', body: payload, ...publicRequest })
  },

  logout() {
    return apiFetch<never>('/auth/logout', { method: 'POST' })
  },

  me() {
    return apiFetch<User>('/auth/me')
  },

  updateProfile(payload: { name: string }) {
    return apiFetch<User>('/auth/profile', { method: 'PUT', body: payload })
  },

  changePassword(payload: ChangePasswordPayload) {
    return apiFetch<never>('/auth/change-password', { method: 'POST', body: payload })
  },
}
