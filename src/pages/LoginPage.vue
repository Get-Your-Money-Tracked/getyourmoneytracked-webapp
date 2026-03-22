<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader2, DollarSign } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

// ── Mode: 'login' | 'signup' | 'forgot' ──────────────────────────────────────
type Mode = 'login' | 'signup' | 'forgot'
const mode = ref<Mode>('login')

const router = useRouter()
const authStore = useAuthStore()
const { login, signup, sendPasswordReset, clearError } = authStore
const error = computed(() => authStore.error)
const isLoading = computed(() => authStore.isLoading)

// ── Form fields ───────────────────────────────────────────────────────────────
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const currency = ref('USD')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// ── Forgot password ───────────────────────────────────────────────────────────
const resetSent = ref(false)

// ── Validation ────────────────────────────────────────────────────────────────
const emailError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const displayNameError = ref('')

function validateEmail(val: string): boolean {
  if (!val) { emailError.value = 'Email is required.'; return false }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { emailError.value = 'Enter a valid email address.'; return false }
  emailError.value = ''
  return true
}

function validatePassword(val: string): boolean {
  if (!val) { passwordError.value = 'Password is required.'; return false }
  if (val.length < 6) { passwordError.value = 'Password must be at least 6 characters.'; return false }
  passwordError.value = ''
  return true
}

function validateConfirmPassword(val: string): boolean {
  if (val !== password.value) { confirmPasswordError.value = 'Passwords do not match.'; return false }
  confirmPasswordError.value = ''
  return true
}

function validateDisplayName(val: string): boolean {
  if (!val.trim()) { displayNameError.value = 'Display name is required.'; return false }
  if (val.trim().length < 2) { displayNameError.value = 'At least 2 characters required.'; return false }
  if (val.trim().length > 50) { displayNameError.value = 'Max 50 characters.'; return false }
  displayNameError.value = ''
  return true
}

// ── Password strength (signup only) ──────────────────────────────────────────
const passwordStrength = computed(() => {
  const len = password.value.length
  if (len === 0) return 0
  if (len < 6) return 1
  if (len <= 8) return 2
  return 3
})

const strengthColor = computed(() => {
  switch (passwordStrength.value) {
    case 1: return 'bg-danger'
    case 2: return 'bg-warning'
    case 3: return 'bg-primary'
    default: return 'bg-border'
  }
})

// ── Clear errors on mode change ───────────────────────────────────────────────
watch(mode, () => {
  clearError()
  emailError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
  displayNameError.value = ''
  resetSent.value = false
})

// ── Submit handlers ───────────────────────────────────────────────────────────
async function handleLogin() {
  const v1 = validateEmail(email.value)
  const v2 = validatePassword(password.value)
  if (!v1 || !v2) return
  try {
    await login(email.value, password.value)
    router.push({ name: 'dashboard' })
  } catch {
    // error already set in store
  }
}

async function handleSignup() {
  const v1 = validateDisplayName(displayName.value)
  const v2 = validateEmail(email.value)
  const v3 = validatePassword(password.value)
  const v4 = validateConfirmPassword(confirmPassword.value)
  if (!v1 || !v2 || !v3 || !v4) return
  try {
    await signup(email.value, password.value, displayName.value.trim(), currency.value)
    router.push({ name: 'dashboard' })
  } catch {
    // error already set in store
  }
}

async function handleForgotPassword() {
  if (!validateEmail(email.value)) return
  try {
    await sendPasswordReset(email.value)
    resetSent.value = true
  } catch {
    // error already set in store
  }
}

const CURRENCIES = [
  { code: 'USD', label: '🇺🇸 USD' },
  { code: 'EUR', label: '🇪🇺 EUR' },
  { code: 'GBP', label: '🇬🇧 GBP' },
  { code: 'BRL', label: '🇧🇷 BRL' },
]
</script>

<template>
  <div
    class="flex min-h-screen min-h-dvh items-center justify-center bg-[var(--color-surface-elevated)] px-4 py-8"
  >
    <div class="w-full max-w-sm">
      <!-- Logo + tagline -->
      <div class="mb-8 flex flex-col items-center text-center">
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white"
        >
          <DollarSign :size="28" />
        </div>
        <h1 class="text-page-title font-semibold text-[var(--color-text-primary)]">
          GetYourMoneyTracked
        </h1>
        <p class="text-body mt-1 text-[var(--color-text-secondary)]">Take control of your finances</p>
      </div>

      <!-- Card -->
      <div
        class="rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
        style="transition: opacity 0.2s ease"
      >
        <!-- ═══════════════════════════════════════════════════
             LOGIN VIEW
             ═══════════════════════════════════════════════════ -->
        <template v-if="mode === 'login'">
          <h2 class="text-section-title mb-5 font-semibold text-[var(--color-text-primary)]">
            Log In
          </h2>

          <!-- Auth error alert -->
          <div
            v-if="error"
            class="mb-4 rounded-xl border-l-4 border-danger bg-red-50 px-4 py-3 dark:bg-red-950/30"
          >
            <p class="text-caption text-danger">{{ error }}</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleLogin" novalidate>
            <!-- Email -->
            <div>
              <input
                v-model="email"
                type="email"
                placeholder="Email"
                autocomplete="email"
                aria-label="Email"
                class="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                :class="{ 'border-danger focus:border-danger focus:ring-danger/20': emailError }"
                @blur="validateEmail(email)"
              />
              <p v-if="emailError" class="text-caption mt-1 text-danger">{{ emailError }}</p>
            </div>

            <!-- Password -->
            <div>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Password"
                  autocomplete="current-password"
                  aria-label="Password"
                  class="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 pr-11 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  :class="{ 'border-danger focus:border-danger focus:ring-danger/20': passwordError }"
                  @blur="validatePassword(password)"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  @click="showPassword = !showPassword"
                  aria-label="Toggle password visibility"
                >
                  <EyeOff v-if="showPassword" :size="18" />
                  <Eye v-else :size="18" />
                </button>
              </div>
              <p v-if="passwordError" class="text-caption mt-1 text-danger">{{ passwordError }}</p>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="isLoading"
              class="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-primary font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Loader2 v-if="isLoading" :size="20" class="animate-spin" />
              <span v-else>Log In</span>
            </button>
          </form>

          <!-- Forgot password -->
          <div class="mt-4 text-center">
            <button
              class="text-caption text-info underline-offset-2 hover:underline"
              @click="mode = 'forgot'"
            >
              Forgot Password?
            </button>
          </div>

          <!-- Divider -->
          <div class="my-5 flex items-center gap-3">
            <div class="h-px flex-1 bg-[var(--color-border)]" />
            <span class="text-caption text-[var(--color-text-muted)]">or</span>
            <div class="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <!-- Sign up link -->
          <p class="text-body text-center text-[var(--color-text-secondary)]">
            Don't have an account?
            <button
              class="ml-1 font-medium text-info hover:underline"
              @click="mode = 'signup'"
            >
              Sign Up
            </button>
          </p>
        </template>

        <!-- ═══════════════════════════════════════════════════
             SIGNUP VIEW
             ═══════════════════════════════════════════════════ -->
        <template v-else-if="mode === 'signup'">
          <h2 class="text-section-title mb-5 font-semibold text-[var(--color-text-primary)]">
            Create Account
          </h2>

          <!-- Auth error alert -->
          <div
            v-if="error"
            class="mb-4 rounded-xl border-l-4 border-danger bg-red-50 px-4 py-3 dark:bg-red-950/30"
          >
            <p class="text-caption text-danger">{{ error }}</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleSignup" novalidate>
            <!-- Display Name -->
            <div>
              <input
                v-model="displayName"
                type="text"
                placeholder="Display Name"
                autocomplete="name"
                aria-label="Display Name"
                class="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                :class="{ 'border-danger focus:border-danger focus:ring-danger/20': displayNameError }"
                @blur="validateDisplayName(displayName)"
              />
              <p v-if="displayNameError" class="text-caption mt-1 text-danger">{{ displayNameError }}</p>
            </div>

            <!-- Email -->
            <div>
              <input
                v-model="email"
                type="email"
                placeholder="Email"
                autocomplete="email"
                aria-label="Email"
                class="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                :class="{ 'border-danger focus:border-danger focus:ring-danger/20': emailError }"
                @blur="validateEmail(email)"
              />
              <p v-if="emailError" class="text-caption mt-1 text-danger">{{ emailError }}</p>
            </div>

            <!-- Password + strength -->
            <div>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Password"
                  autocomplete="new-password"
                  aria-label="Password"
                  class="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 pr-11 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  :class="{ 'border-danger focus:border-danger focus:ring-danger/20': passwordError }"
                  @blur="validatePassword(password)"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  @click="showPassword = !showPassword"
                  aria-label="Toggle password visibility"
                >
                  <EyeOff v-if="showPassword" :size="18" />
                  <Eye v-else :size="18" />
                </button>
              </div>
              <!-- Strength bar -->
              <div class="mt-1.5 flex gap-1" aria-hidden="true">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-colors duration-200"
                  :class="passwordStrength >= i ? strengthColor : 'bg-[var(--color-border)]'"
                />
              </div>
              <p v-if="passwordError" class="text-caption mt-1 text-danger">{{ passwordError }}</p>
            </div>

            <!-- Confirm Password -->
            <div>
              <div class="relative">
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Confirm Password"
                  autocomplete="new-password"
                  aria-label="Confirm Password"
                  class="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 pr-11 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  :class="{ 'border-danger focus:border-danger focus:ring-danger/20': confirmPasswordError }"
                  @blur="validateConfirmPassword(confirmPassword)"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  @click="showConfirmPassword = !showConfirmPassword"
                  aria-label="Toggle confirm password visibility"
                >
                  <EyeOff v-if="showConfirmPassword" :size="18" />
                  <Eye v-else :size="18" />
                </button>
              </div>
              <p v-if="confirmPasswordError" class="text-caption mt-1 text-danger">{{ confirmPasswordError }}</p>
            </div>

            <!-- Currency -->
            <div class="relative">
              <select
                v-model="currency"
                aria-label="Default Currency"
                class="h-12 w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 pr-10 text-sm text-[var(--color-text-primary)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
                  {{ c.label }}
                </option>
              </select>
              <svg
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="isLoading"
              class="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-primary font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Loader2 v-if="isLoading" :size="20" class="animate-spin" />
              <span v-else>Create Account</span>
            </button>
          </form>

          <!-- Back to login -->
          <p class="text-body mt-5 text-center text-[var(--color-text-secondary)]">
            Already have an account?
            <button class="ml-1 font-medium text-info hover:underline" @click="mode = 'login'">
              Log In
            </button>
          </p>
        </template>

        <!-- ═══════════════════════════════════════════════════
             FORGOT PASSWORD VIEW
             ═══════════════════════════════════════════════════ -->
        <template v-else-if="mode === 'forgot'">
          <h2 class="text-section-title mb-2 font-semibold text-[var(--color-text-primary)]">
            Reset Password
          </h2>
          <p class="text-body mb-5 text-[var(--color-text-secondary)]">
            Enter your email and we'll send you a reset link.
          </p>

          <!-- Success alert -->
          <div
            v-if="resetSent"
            class="mb-4 rounded-xl border-l-4 border-primary bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30"
          >
            <p class="text-caption text-primary">Reset email sent! Check your inbox.</p>
          </div>

          <!-- Error alert -->
          <div
            v-if="error"
            class="mb-4 rounded-xl border-l-4 border-danger bg-red-50 px-4 py-3 dark:bg-red-950/30"
          >
            <p class="text-caption text-danger">{{ error }}</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleForgotPassword" novalidate>
            <div>
              <input
                v-model="email"
                type="email"
                placeholder="Email"
                autocomplete="email"
                aria-label="Email"
                class="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                :class="{ 'border-danger focus:border-danger focus:ring-danger/20': emailError }"
                @blur="validateEmail(email)"
              />
              <p v-if="emailError" class="text-caption mt-1 text-danger">{{ emailError }}</p>
            </div>

            <button
              type="submit"
              :disabled="isLoading || resetSent"
              class="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Loader2 v-if="isLoading" :size="20" class="animate-spin" />
              <span v-else>Send Reset Link</span>
            </button>
          </form>

          <div class="mt-5 text-center">
            <button
              class="text-caption text-info underline-offset-2 hover:underline"
              @click="mode = 'login'"
            >
              ← Back to Login
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
