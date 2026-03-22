import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// ── Mock Firebase auth ────────────────────────────────────────────────────────
const mockSignIn = vi.fn()
const mockCreateUser = vi.fn()
const mockUpdateProfile = vi.fn()
const mockSignOut = vi.fn()
const mockSendReset = vi.fn()

vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>()
  return {
    ...actual,
    getAuth: vi.fn(() => ({})),
    signInWithEmailAndPassword: (...args: unknown[]) => mockSignIn(...args),
    createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUser(...args),
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    signOut: (...args: unknown[]) => mockSignOut(...args),
    sendPasswordResetEmail: (...args: unknown[]) => mockSendReset(...args),
  }
})

// ── Mock initializeUser mutation ──────────────────────────────────────────────
const mockCallInitializeUser = vi.fn()
vi.mock('@/graphql/mutations/auth', () => ({
  callInitializeUser: (...args: unknown[]) => mockCallInitializeUser(...args),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeFirebaseUser(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'uid-123',
    email: 'user@example.com',
    displayName: 'Test User',
    getIdToken: vi.fn().mockResolvedValue('mock-token'),
    ...overrides,
  }
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Initial state ───────────────────────────────────────────────────────────
  it('starts unauthenticated with isLoading = true', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isLoading).toBe(true)
    expect(store.user).toBeNull()
    expect(store.error).toBeNull()
  })

  it('becomes authenticated after setUser is called', () => {
    const store = useAuthStore()
    store.setUser(makeFirebaseUser() as never)
    expect(store.isAuthenticated).toBe(true)
    expect(store.isLoading).toBe(false)
  })

  // ── login ───────────────────────────────────────────────────────────────────
  it('calls signInWithEmailAndPassword on login', async () => {
    const user = makeFirebaseUser()
    mockSignIn.mockResolvedValueOnce({ user })
    const store = useAuthStore()
    await store.login('user@example.com', 'password123')
    expect(mockSignIn).toHaveBeenCalledWith({}, 'user@example.com', 'password123')
    expect(store.error).toBeNull()
  })

  it('sets error state on failed login', async () => {
    mockSignIn.mockRejectedValueOnce({ code: 'auth/wrong-password' })
    const store = useAuthStore()
    await expect(store.login('user@example.com', 'wrong')).rejects.toBeDefined()
    expect(store.error).toBe('Incorrect email or password.')
  })

  // ── signup ──────────────────────────────────────────────────────────────────
  it('calls createUserWithEmailAndPassword and initializeUser on signup', async () => {
    const user = makeFirebaseUser()
    mockCreateUser.mockResolvedValueOnce({ user })
    mockUpdateProfile.mockResolvedValueOnce(undefined)
    mockCallInitializeUser.mockResolvedValueOnce(undefined)
    const store = useAuthStore()
    await store.signup('user@example.com', 'pass123', 'Test User', 'USD')
    expect(mockCreateUser).toHaveBeenCalledWith({}, 'user@example.com', 'pass123')
    expect(mockCallInitializeUser).toHaveBeenCalledWith('Test User', 'USD')
    expect(store.error).toBeNull()
    expect(store.defaultCurrency).toBe('USD')
  })

  it('sets error state when email is already in use', async () => {
    mockCreateUser.mockRejectedValueOnce({ code: 'auth/email-already-in-use' })
    const store = useAuthStore()
    await expect(store.signup('dup@example.com', 'pass', 'Dup', 'USD')).rejects.toBeDefined()
    expect(store.error).toBe('An account with this email already exists.')
  })

  // ── logout ──────────────────────────────────────────────────────────────────
  it('clears state and calls signOut on logout', async () => {
    mockSignOut.mockResolvedValueOnce(undefined)
    const store = useAuthStore()
    store.setUser(makeFirebaseUser() as never)
    await store.logout()
    expect(mockSignOut).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.error).toBeNull()
    expect(store.defaultCurrency).toBe('USD')
  })

  // ── clearError ──────────────────────────────────────────────────────────────
  it('clears the error state', async () => {
    mockSignIn.mockRejectedValueOnce({ code: 'auth/wrong-password' })
    const store = useAuthStore()
    await expect(store.login('x@x.com', 'x')).rejects.toBeDefined()
    expect(store.error).not.toBeNull()
    store.clearError()
    expect(store.error).toBeNull()
  })

  // ── computed helpers ────────────────────────────────────────────────────────
  it('derives initials from displayName', () => {
    const store = useAuthStore()
    store.setUser(makeFirebaseUser({ displayName: 'Alice Smith' }) as never)
    expect(store.initials).toBe('AS')
  })

  it('falls back to email for initials when no displayName', () => {
    const store = useAuthStore()
    store.setUser(makeFirebaseUser({ displayName: null, email: 'bob@example.com' }) as never)
    expect(store.initials).toBe('BO')
  })
})
