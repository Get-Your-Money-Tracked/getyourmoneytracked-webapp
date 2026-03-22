import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { install as urqlPlugin } from '@urql/vue'
import router from '@/router'
import { urqlClient, setOnUnauthorized } from '@/lib/urql'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import App from './App.vue'
import '@/assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(urqlPlugin, urqlClient)

// Initialize theme (reads localStorage / prefers-color-scheme)
const themeStore = useThemeStore()
themeStore.init()

const authStore = useAuthStore()

// Wire 401 handler: when server responds with 401, log out and redirect to login
setOnUnauthorized(async () => {
  await authStore.logout()
  router.push({ name: 'login', query: { reason: 'session-expired' } })
})

// Route guard — protect authenticated routes
// Note: while isLoading is true Firebase hasn't resolved yet — allow navigation
// through so that App.vue shows the loader and the guard re-runs after resolution
router.beforeEach((to) => {
  // While auth is still loading, let it pass — App.vue shows AppLoader
  if (authStore.isLoading) {
    return true
  }

  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }
  // implicitly returns undefined — navigation proceeds
})

// Wait for Firebase to resolve auth state before mounting the app.
// onAuthStateChanged fires exactly once (then we unsubscribe) — this prevents
// the flash-of-login-page for returning users.
const unsubscribe = onAuthStateChanged(auth, (user) => {
  authStore.setUser(user)
  unsubscribe()

  // After auth resolves, re-run the route guard in case the initial navigation
  // was allowed through while isLoading was still true.
  router.replace(router.currentRoute.value.fullPath).catch(() => {
    // ignore redundant navigation errors
  })

  app.mount('#app')
})
