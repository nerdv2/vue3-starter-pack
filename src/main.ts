import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import '@/styles/main.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

const auth = useAuthStore(pinia)

// When the refresh cookie can no longer restore the session, clear the store
// and send the user back to the login page.
setUnauthorizedHandler(() => {
  auth.clear()
  const current = router.currentRoute.value
  if (current.name !== 'login') {
    void router.push({ name: 'login', query: { redirect: current.fullPath } })
  }
})

// Restore an existing session before mounting so the guard can decide without
// flashing the login page.
void auth.init()

app.mount('#app')
