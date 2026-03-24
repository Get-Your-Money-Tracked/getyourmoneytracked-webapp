import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from 'firebase/auth'
import { ONBOARDING_COMPLETED_KEY, SIGNUP_TIMESTAMP_KEY, DISPLAY_NAME_KEY } from '@/utils/constants'

// localStorage key for persisting defaultCurrency between sessions
const CURRENCY_KEY = 'gymt_default_currency'

/** All localStorage keys that should be cleared on logout (so a new user gets a fresh experience) */
const ONBOARDING_KEYS = [
  ONBOARDING_COMPLETED_KEY,
  SIGNUP_TIMESTAMP_KEY,
  'tip_dismissed_dashboard',
  'tip_dismissed_budgets',
  'tip_dismissed_accounts',
  'tip_dismissed_subscriptions',
  'tip_dismissed_history',
]

function loadCurrencyFromStorage(): string {
  try {
    return localStorage.getItem(CURRENCY_KEY) ?? 'USD'
  } catch {
    return 'USD'
  }
}

function saveCurrencyToStorage(currency: string): void {
  try {
    localStorage.setItem(CURRENCY_KEY, currency)
  } catch {
    // localStorage may be unavailable in some environments — ignore
  }
}

function loadDisplayNameFromStorage(): string | null {
  try {
    return localStorage.getItem(DISPLAY_NAME_KEY)
  } catch {
    return null
  }
}

function saveDisplayNameToStorage(name: string): void {
  try {
    localStorage.setItem(DISPLAY_NAME_KEY, name)
  } catch {
    // localStorage may be unavailable — ignore
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)       // true until initial onAuthStateChanged fires
  const isSubmitting = ref(false)   // true during login/signup form submission
  const error = ref<string | null>(null)
  const defaultCurrency = ref<string>('USD')
  /** Set to true after a successful signup — cleared once the onboarding redirect is consumed */
  const isNewUser = ref(false)
  /**
   * Local display name override — stored in localStorage as a stopgap until a backend
   * updateUser mutation is available. Takes precedence over the Firebase displayName.
   */
  const displayNameOverride = ref<string | null>(loadDisplayNameFromStorage())

  // ── Computed ───────────────────────────────────────────────
  const isAuthenticated = computed(() => user.value !== null)
  const displayName = computed(
    () => displayNameOverride.value ?? user.value?.displayName ?? user.value?.email ?? 'there',
  )
  const email = computed(() => user.value?.email ?? '')
  const initials = computed(() => {
    const name = displayNameOverride.value ?? user.value?.displayName ?? user.value?.email ?? ''
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  })

  // ── Helpers ────────────────────────────────────────────────
  function setUser(firebaseUser: User | null) {
    user.value = firebaseUser
    isLoading.value = false
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function clearError() {
    error.value = null
  }

  function mapFirebaseError(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.'
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }

  // ── Actions ────────────────────────────────────────────────
  async function login(emailInput: string, password: string): Promise<void> {
    error.value = null
    isSubmitting.value = true
    try {
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth')
      await signInWithEmailAndPassword(getAuth(), emailInput, password)
      // Currency will be hydrated from API via hydrateFromApi() called by onAuthStateChanged
      // user is set via onAuthStateChanged in main.ts
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      error.value = mapFirebaseError(code)
      throw e
    } finally {
      isSubmitting.value = false
    }
  }

  async function signup(
    emailInput: string,
    password: string,
    displayNameInput: string,
    currency: string,
  ): Promise<void> {
    error.value = null
    isSubmitting.value = true
    try {
      const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import(
        'firebase/auth'
      )
      const credential = await createUserWithEmailAndPassword(getAuth(), emailInput, password)

      // Update Firebase displayName
      await updateProfile(credential.user, { displayName: displayNameInput })

      defaultCurrency.value = currency
      saveCurrencyToStorage(currency)

      // Save signup timestamp for 7-day tip cutoff (Story 12.3)
      try {
        localStorage.setItem(SIGNUP_TIMESTAMP_KEY, new Date().toISOString())
      } catch {
        // localStorage may be unavailable — ignore
      }

      // Call initializeUser mutation — imported lazily to avoid circular deps
      const { callInitializeUser } = await import('@/graphql/mutations/auth')
      await callInitializeUser(displayNameInput, currency)

      isNewUser.value = true
      setUser(credential.user)
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      error.value = mapFirebaseError(code)
      throw e
    } finally {
      isSubmitting.value = false
    }
  }

  async function sendPasswordReset(emailInput: string): Promise<void> {
    error.value = null
    try {
      const { getAuth, sendPasswordResetEmail } = await import('firebase/auth')
      await sendPasswordResetEmail(getAuth(), emailInput)
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      error.value = mapFirebaseError(code)
      throw e
    }
  }

  /**
   * Update user profile (display name + default currency).
   * Calls the backend updateUser mutation and syncs state locally.
   */
  async function updateProfile(name: string, currency: string): Promise<void> {
    const { callUpdateUser } = await import('@/graphql/mutations/auth')
    const updated = await callUpdateUser(name, currency)
    displayNameOverride.value = updated.displayName
    saveDisplayNameToStorage(updated.displayName)
    defaultCurrency.value = updated.defaultCurrency
    saveCurrencyToStorage(updated.defaultCurrency)
  }

  /**
   * Hydrate the store from the backend `me` query.
   * Called on initial auth state change (login) to sync currency + display name.
   */
  async function hydrateFromApi(): Promise<void> {
    try {
      const { callMe } = await import('@/graphql/mutations/auth')
      const me = await callMe()
      if (me) {
        defaultCurrency.value = me.defaultCurrency
        saveCurrencyToStorage(me.defaultCurrency)
        displayNameOverride.value = me.displayName
        saveDisplayNameToStorage(me.displayName)
      }
    } catch {
      // If the API is unreachable, fall back to localStorage values
      defaultCurrency.value = loadCurrencyFromStorage()
    }
  }

  async function logout(): Promise<void> {
    const { getAuth, signOut } = await import('firebase/auth')
    await signOut(getAuth())
    user.value = null
    error.value = null
    isNewUser.value = false
    defaultCurrency.value = 'USD'
    saveCurrencyToStorage('USD')
    displayNameOverride.value = null
    try {
      localStorage.removeItem(DISPLAY_NAME_KEY)
    } catch {
      // ignore
    }

    // Clear onboarding + tip keys so the next user on a shared device gets a fresh experience
    try {
      for (const key of ONBOARDING_KEYS) {
        localStorage.removeItem(key)
      }
    } catch {
      // localStorage may be unavailable — ignore
    }

    // Reset all other stores to prevent stale data leaking between sessions
    try {
      const { useAccountsStore } = await import('@/stores/accounts')
      const { useCategoriesStore } = await import('@/stores/categories')
      const { useTransactionsStore } = await import('@/stores/transactions')
      const accountsStore = useAccountsStore()
      const categoriesStore = useCategoriesStore()
      const transactionsStore = useTransactionsStore()
      // Setup stores don't have $reset(), so clear manually
      accountsStore.accounts = []
      accountsStore.error = null
      categoriesStore.categories = []
      categoriesStore.error = null
      transactionsStore.transactions = []
      transactionsStore.error = null
      transactionsStore.lastUsedAccountId = null
      transactionsStore.lastUsedCategoryId = null
    } catch {
      // Stores may not be initialized yet — safe to ignore
    }
  }

  return {
    user,
    isLoading,
    isSubmitting,
    isAuthenticated,
    isNewUser,
    displayName,
    email,
    initials,
    error,
    defaultCurrency,
    setUser,
    setLoading,
    clearError,
    login,
    signup,
    sendPasswordReset,
    updateProfile,
    hydrateFromApi,
    logout,
  }
})
