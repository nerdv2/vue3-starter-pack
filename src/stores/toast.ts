import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

const DEFAULT_TIMEOUT = 4000
const ERROR_TIMEOUT = 6500

export const useToastStore = defineStore('toast', () => {
  const items = ref<Toast[]>([])
  let sequence = 0

  function push(type: ToastType, message: string, timeout = DEFAULT_TIMEOUT): number {
    const id = ++sequence
    items.value.push({ id, type, message })

    if (timeout > 0) {
      window.setTimeout(() => remove(id), timeout)
    }

    return id
  }

  function remove(id: number): void {
    items.value = items.value.filter((toast) => toast.id !== id)
  }

  function success(message: string): number {
    return push('success', message)
  }

  function error(message: string): number {
    return push('error', message, ERROR_TIMEOUT)
  }

  function info(message: string): number {
    return push('info', message)
  }

  return { items, push, remove, success, error, info }
})
