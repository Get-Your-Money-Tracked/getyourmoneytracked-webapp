import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { install as urqlPlugin } from '@urql/vue'
import router from '@/router'
import { urqlClient, setOnUnauthorized } from '@/lib/urql'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ONBOARDING_COMPLETED_KEY } from '@/utils/constants'
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
router.beforeEach((to) => {
  // While auth is still loading, let it pass — App.vue shows AppLoader
  // The guard will re-run after auth resolves (see router.replace below)
  if (authStore.isLoading) {
    return true
  }

  const requiresAuth = to.meta.requiresAuth !== false
  const isOnboardingRoute = to.name === 'onboarding'
  const onboardingCompleted = (() => {
    try { return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true' } catch { return false }
  })()

  if (requiresAuth && !authStore.isAuthenticated) {
    // Preserve the intended destination for post-login redirect
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Redirect returning users away from /onboarding (onboarding already done)
  if (isOnboardingRoute && authStore.isAuthenticated && onboardingCompleted) {
    return { name: 'dashboard' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    // Reverse guard: logged-in users should not see the login page.
    // Resolve the redirect query param if present; fall back to /dashboard.
    const redirect = to.query.redirect
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect
    }
    return { name: 'dashboard' }
  }
  // implicitly returns undefined — navigation proceeds
})

// Wait for Firebase to resolve auth state before mounting the app.
// Keep the listener alive so subsequent login/logout also update the store.
let appMounted = false
onAuthStateChanged(auth, async (user) => {
  authStore.setUser(user)

  // Hydrate currency + display name from API for existing users
  if (user && !authStore.isNewUser) {
    authStore.hydrateFromApi().catch(() => {
      // Silently fall back to localStorage if API is unreachable
    })
  }

  if (!appMounted) {
    appMounted = true

    // After auth resolves, re-run the route guard in case the initial navigation
    // was allowed through while isLoading was still true.
    router.replace(router.currentRoute.value.fullPath).catch(() => {
      // ignore redundant navigation errors
    })

    app.mount('#app')
  } else if (user && router.currentRoute.value.name === 'login') {
    // User just logged in (onAuthStateChanged fired after signInWithEmailAndPassword).
    // New users (isNewUser flag set by signup()) go to /onboarding; others go to /dashboard.
    const onboardingCompleted = (() => {
      try { return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true' } catch { return false }
    })()

    if (authStore.isNewUser && !onboardingCompleted) {
      authStore.isNewUser = false
      router.replace({ name: 'onboarding' }).catch(() => {})
      return
    }

    // Redirect away from login page, respecting the redirect query param.
    const redirect = router.currentRoute.value.query.redirect
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      router.replace(redirect).catch(() => {})
    } else {
      router.replace({ name: 'dashboard' }).catch(() => {})
    }
  }
})
