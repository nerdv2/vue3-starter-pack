import { ref } from 'vue'

export type ThemePreference = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'customer-db:theme'

function readStoredPreference(): ThemePreference {
  const stored = window.localStorage.getItem(STORAGE_KEY)

  return stored === 'light' || stored === 'dark' ? stored : 'auto'
}

/**
 * Theme preference shared by every caller: `auto` follows the system scheme,
 * `light`/`dark` force one and persist in localStorage.
 */
const preference = ref<ThemePreference>(readStoredPreference())

function applyPreference(): void {
  const root = document.documentElement
  if (preference.value === 'auto') {
    root.removeAttribute('data-theme')
    window.localStorage.removeItem(STORAGE_KEY)
  } else {
    root.dataset.theme = preference.value
    window.localStorage.setItem(STORAGE_KEY, preference.value)
  }
}

applyPreference()

export function useTheme() {
  function setPreference(next: ThemePreference): void {
    preference.value = next
    applyPreference()
  }

  /** Flip to the opposite of what is currently rendered. */
  function toggle(): void {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = preference.value === 'dark' || (preference.value === 'auto' && systemDark)

    setPreference(isDark ? 'light' : 'dark')
  }

  return { preference, setPreference, toggle }
}
