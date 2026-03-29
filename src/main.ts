import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { install as urqlPlugin } from '@urql/vue'
import router from '@/router'
import { urqlClient, setOnUnauthorized, markAuthReady } from '@/lib/urql'
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

// Promise that resolves once Firebase's initial auth state is known.
// This prevents the route guard from making decisions before we know
// whether the user is logged in or not.
let resolveAuthReady: () => void
const authReady = new Promise<void>((resolve) => {
  resolveAuthReady = resolve
})

// Route guard — protect authenticated routes
router.beforeEach(async (to) => {
  // Block navigation until Firebase has resolved the initial auth state.
  // Without this, the first navigation (/ → /dashboard) would slip through
  // before we know if the user is authenticated, causing API errors.
  await authReady

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

// Wait for Firebase to resolve auth state before allowing navigation.
// The app is mounted eagerly so the AppLoader is visible while Firebase
// and the backend API initialise (prevents blank screen on slow networks
// or when the backend is cold-starting).
let appMounted = false
onAuthStateChanged(auth, async (user) => {
  // 1. Mount the app immediately on the very first callback so the
  //    AppLoader (driven by authStore.isLoading) renders right away.
  if (!appMounted) {
    appMounted = true
    app.mount('#app')
  }

  // 2. Update the store with the Firebase user (or null).
  //    NOTE: do NOT call setUser() before mount — it sets isLoading=false
  //    which would hide the AppLoader before hydration is done.
  //    For the initial load we need isLoading to stay true until hydration
  //    finishes, so we defer setUser to after hydrateFromApi.
  if (user && !authStore.isNewUser) {
    // Hydrate currency + display name from the backend before marking
    // auth as ready. This ensures the route guard (which awaits authReady)
    // won't let navigation proceed until we have a valid token + user data.
    await authStore.hydrateFromApi().catch(() => {
      // Silently fall back to localStorage if API is unreachable
    })
  }

  // 3. Now set the user (clears isLoading) and unblock the route guard.
  authStore.setUser(user)

  if (resolveAuthReady) {
    // Unblock the route guard now that auth state + hydration are complete.
    resolveAuthReady()
    // Enable 401 auto-logout now that the initial auth window has closed.
    // Before this point, transient 401s (e.g. from hydrateFromApi racing a
    // slow token refresh) are suppressed to avoid force-logging out the user.
    markAuthReady()
    // Clear so we only resolve once.
    resolveAuthReady = undefined!
  }

  // 4. Handle post-login redirect for subsequent auth state changes (not the initial load).
  if (user && router.currentRoute.value.name === 'login') {
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
