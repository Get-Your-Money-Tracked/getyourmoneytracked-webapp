import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const defaultCurrency = ref<string>('USD')

  // ── Computed ───────────────────────────────────────────────
  const isAuthenticated = computed(() => user.value !== null)
  const displayName = computed(() => user.value?.displayName ?? user.value?.email ?? 'there')
  const email = computed(() => user.value?.email ?? '')
  const initials = computed(() => {
    const name = user.value?.displayName ?? user.value?.email ?? ''
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
    isLoading.value = true
    try {
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth')
      await signInWithEmailAndPassword(getAuth(), emailInput, password)
      // user is set via onAuthStateChanged in main.ts
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      error.value = mapFirebaseError(code)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function signup(
    emailInput: string,
    password: string,
    displayNameInput: string,
    currency: string,
  ): Promise<void> {
    error.value = null
    isLoading.value = true
    try {
      const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import(
        'firebase/auth'
      )
      const credential = await createUserWithEmailAndPassword(getAuth(), emailInput, password)

      // Update Firebase displayName
      await updateProfile(credential.user, { displayName: displayNameInput })

      defaultCurrency.value = currency

      // Call initializeUser mutation — imported lazily to avoid circular deps
      const { callInitializeUser } = await import('@/graphql/mutations/auth')
      await callInitializeUser(displayNameInput, currency)

      setUser(credential.user)
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      error.value = mapFirebaseError(code)
      throw e
    } finally {
      isLoading.value = false
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

  async function logout(): Promise<void> {
    const { getAuth, signOut } = await import('firebase/auth')
    await signOut(getAuth())
    user.value = null
    error.value = null
    defaultCurrency.value = 'USD'

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
    isAuthenticated,
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
    logout,
  }
})
