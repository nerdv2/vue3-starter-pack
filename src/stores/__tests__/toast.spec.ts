import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useToastStore } from '@/stores/toast'

describe('toast store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('pushes and auto-dismisses toasts', () => {
    const toast = useToastStore()

    toast.success('Saved.')
    toast.error('Boom.')

    expect(toast.items).toHaveLength(2)
    expect(toast.items[0]?.type).toBe('success')

    vi.advanceTimersByTime(7000)
    expect(toast.items).toHaveLength(0)

    vi.useRealTimers()
  })

  it('removes a toast by id', () => {
    const toast = useToastStore()
    const id = toast.info('Hello')

    toast.remove(id)
    expect(toast.items).toEqual([])

    vi.useRealTimers()
  })
})
