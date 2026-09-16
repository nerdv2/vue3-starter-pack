<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
import CustomerAvatar from '@/components/CustomerAvatar.vue'
import { useTheme, type ThemePreference } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()
const { preference, setPreference } = useTheme()

const mobileOpen = ref(false)

const navigation = [
  { name: 'dashboard', label: 'Dashboard', icon: '◧' },
  { name: 'customers', label: 'Customers', icon: '☰' },
  { name: 'transfer', label: 'Import & export', icon: '⇅' },
  { name: 'profile', label: 'Profile', icon: '☺' },
] as const

const activeName = computed(() =>
  route.name === 'customer-detail' ? 'customers' : String(route.name ?? ''),
)

const pageTitle = computed(() =>
  typeof route.meta.title === 'string' ? route.meta.title : 'Customer DB',
)

const themeLabel = computed(() => {
  const labels: Record<ThemePreference, string> = {
    auto: 'Auto',
    light: 'Light',
    dark: 'Dark',
  }

  return labels[preference.value]
})

function cycleTheme(): void {
  const order: ThemePreference[] = ['auto', 'light', 'dark']
  const next = order[(order.indexOf(preference.value) + 1) % order.length] ?? 'auto'
  setPreference(next)
}

async function signOut(): Promise<void> {
  await auth.logout()
  toast.info('Signed out.')
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar" :class="{ 'sidebar--open': mobileOpen }">
      <div class="brand">
        <img src="/favicon.svg" alt="" width="30" height="30" />
        <div class="brand__text">
          <strong>Customer DB</strong>
          <span class="muted">Slim 4 + Vue 3</span>
        </div>
      </div>

      <nav class="nav" aria-label="Main navigation">
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :to="{ name: item.name }"
          class="nav__link"
          :class="{ 'nav__link--active': activeName === item.name }"
          @click="mobileOpen = false"
        >
          <span class="nav__icon" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="sidebar__footer">
        <button type="button" class="theme-toggle" @click="cycleTheme">
          <span aria-hidden="true">◐</span> Theme: {{ themeLabel }}
        </button>
        <div class="user">
          <CustomerAvatar :name="auth.displayName" :size="34" />
          <div class="user__meta">
            <strong>{{ auth.displayName }}</strong>
            <span class="muted">{{ auth.user?.type }}</span>
          </div>
        </div>
        <AppButton size="sm" variant="secondary" block @click="signOut">Sign out</AppButton>
      </div>
    </aside>

    <div v-if="mobileOpen" class="scrim" @click="mobileOpen = false" />

    <main class="main">
      <header class="topbar">
        <button
          type="button"
          class="hamburger"
          aria-label="Open navigation"
          @click="mobileOpen = true"
        >
          ☰
        </button>
        <h1 class="topbar__title">{{ pageTitle }}</h1>
        <span class="spacer" />
        <span class="badge badge--neutral">{{ auth.user?.type }}</span>
      </header>
      <div class="content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  width: var(--sidebar-width);
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem 1rem;
  background: var(--surface);
  border-right: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0 0.4rem;
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand__text .muted {
  font-size: 0.78rem;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.nav__link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.7rem;
  border-radius: var(--radius);
  color: var(--text-muted);
  font-weight: 550;
  text-decoration: none;
  transition:
    background var(--transition),
    color var(--transition);
}

.nav__link:hover {
  background: var(--surface-hover);
  color: var(--text);
  text-decoration: none;
}

.nav__link--active {
  background: var(--primary-soft);
  color: var(--primary);
}

.nav__icon {
  width: 1.1rem;
  text-align: center;
}

.sidebar__footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  border-top: 1px solid var(--border);
  padding-top: 0.9rem;
}

.theme-toggle {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius);
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  color: var(--text-muted);
  cursor: pointer;
  text-align: left;
}

.theme-toggle:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.user {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.user__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.user__meta strong {
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user__meta .muted {
  font-size: 0.78rem;
  text-transform: capitalize;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 85%, transparent);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.topbar__title {
  font-size: 1.05rem;
}

.hamburger {
  display: none;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius);
  padding: 0.25rem 0.55rem;
  cursor: pointer;
}

.content {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 1.5rem;
  flex: 1;
}

.scrim {
  display: none;
}

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform var(--transition);
    box-shadow: var(--shadow-md);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .hamburger {
    display: inline-flex;
  }

  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 30;
    background: rgb(15 23 42 / 0.45);
  }

  .content {
    padding: 1rem;
  }
}
</style>
