import { apiFetch } from './client'
import type {
  Customer,
  CustomerListParams,
  CustomerPayload,
  CustomerStats,
  ExportPayload,
  ExportQueued,
  ImportQueued,
} from './types'

export const customersApi = {
  list(params: CustomerListParams = {}) {
    return apiFetch<Customer[]>('/customer', { query: { ...params } })
  },

  stats() {
    return apiFetch<CustomerStats>('/customer/stats')
  },

  get(id: number) {
    return apiFetch<Customer>(`/customer/${id}`)
  },

  create(payload: CustomerPayload) {
    return apiFetch<Customer>('/customer', { method: 'POST', body: payload })
  },

  update(id: number, payload: CustomerPayload) {
    return apiFetch<Customer>(`/customer/${id}`, { method: 'PUT', body: payload })
  },

  remove(id: number) {
    return apiFetch<never>(`/customer/${id}`, { method: 'DELETE' })
  },

  uploadAvatar(id: number, file: File) {
    const formData = new FormData()
    formData.append('avatar', file)

    return apiFetch<Customer>(`/customer/${id}/avatar`, { method: 'POST', formData })
  },

  removeAvatar(id: number) {
    return apiFetch<Customer>(`/customer/${id}/avatar`, { method: 'DELETE' })
  },

  export(payload: ExportPayload) {
    return apiFetch<ExportQueued>('/customer/export', { method: 'POST', body: payload })
  },

  import(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return apiFetch<ImportQueued>('/customer/import', { method: 'POST', formData })
  },
}
