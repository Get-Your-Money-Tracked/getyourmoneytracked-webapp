<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAccountsStore } from '@/stores/accounts'
import { useAuthStore } from '@/stores/auth'
import { getCurrencySymbol } from '@/utils/currency'

import type { AccountType } from '@/types'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const accountsStore = useAccountsStore()
const authStore = useAuthStore()

// ── Form state ────────────────────────────────────────────────
const name = ref('')
const accountType = ref<AccountType>('BANK')
const startingBalance = ref('0')
const selectedIcon = ref<string | null>(null)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

// ── Icon options ──────────────────────────────────────────────
const ICON_OPTIONS = ['🏦', '💵', '💳', '🏠', '📱', '✈️', '🛍️', '🎓', '💼', '🏪', '🚗', '💊']

// ── Type options ──────────────────────────────────────────────
const TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
]

// ── Validation ────────────────────────────────────────────────
const nameError = ref<string | null>(null)

function validateName(): boolean {
  const trimmed = name.value.trim()
  if (!trimmed) {
    nameError.value = 'Account name is required.'
    return false
  }
  if (trimmed.length > 100) {
    nameError.value = 'Name must be 100 characters or less.'
    return false
  }
  nameError.value = null
  return true
}

const isFormValid = computed(() => name.value.trim().length > 0)

// ── Reset on open ─────────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = ''
      accountType.value = 'BANK'
      startingBalance.value = '0'
      selectedIcon.value = null
      nameError.value = null
      submitError.value = null
    }
  },
)

// ── Swipe-to-dismiss (touch) ──────────────────────────────────
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const delta = e.changedTouches[0].clientY - touchStartY
  if (delta > 80) {
    emit('close')
  }
}

// ── Submit ────────────────────────────────────────────────────
async function handleSubmit() {
  const nameValid = validateName()
  if (!nameValid) return

  isSubmitting.value = true
  submitError.value = null
  try {
    await accountsStore.createAccount({
      name: name.value.trim(),
      type: accountType.value,
      currency: authStore.defaultCurrency,
      startingBalance: startingBalance.value || '0',
      icon: selectedIcon.value,
    })
    emit('created')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to create account.'
  } finally {
    isSubmitting.value = false
  }
}

// ── Balance input: allow negative / decimals ──────────────────
function onBalanceInput(e: Event) {
  const target = e.target as HTMLInputElement
  // Allow negative, digits, and a single decimal point
  startingBalance.value = target.value
}
</script>

<template>
  <!-- Backdrop -->
  <Transition name="backdrop">
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/40"
      aria-hidden="true"
      @click="$emit('close')"
    />
  </Transition>

  <!-- Sheet -->
  <Transition name="sheet">
    <div
      v-if="open"
      class="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface pb-safe"
      :style="{ boxShadow: 'var(--shadow-sheet)' }"
      role="dialog"
      aria-modal="true"
      aria-label="New Account"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- Drag handle -->
      <div class="flex justify-center pb-2 pt-3">
        <div class="h-1 w-8 rounded-full bg-border" aria-hidden="true" />
      </div>

      <div class="px-5 pb-8 pt-2">
        <!-- Title -->
        <h2 class="text-section-title mb-5 font-semibold text-text-primary">New Account</h2>

        <!-- Name field -->
        <div class="mb-4">
          <label
            for="account-name"
            class="text-caption mb-1 block font-medium text-text-secondary"
          >
            Name
          </label>
          <input
            id="account-name"
            v-model="name"
            type="text"
            placeholder='e.g., "Main Bank"'
            maxlength="100"
            class="h-12 w-full rounded-xl border border-border bg-surface-muted px-4 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            :class="{ 'border-danger ring-2 ring-danger/20': nameError }"
            autocomplete="off"
            @blur="validateName"
          />
          <p v-if="nameError" class="text-caption mt-1 text-danger">{{ nameError }}</p>
        </div>

        <!-- Account Type segmented control -->
        <div class="mb-4">
          <p class="text-caption mb-1.5 font-medium text-text-secondary">Account Type</p>
          <div
            class="flex h-10 gap-1 rounded-xl bg-surface-muted p-1"
            role="radiogroup"
            aria-label="Account type"
          >
            <button
              v-for="opt in TYPE_OPTIONS"
              :key="opt.value"
              type="button"
              role="radio"
              :aria-checked="accountType === opt.value"
              class="text-caption flex flex-1 items-center justify-center rounded-lg font-medium transition-all duration-150"
              :class="
                accountType === opt.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              "
              @click="accountType = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Starting Balance -->
        <div class="mb-4">
          <label
            for="starting-balance"
            class="text-caption mb-1 block font-medium text-text-secondary"
          >
            Starting Balance
          </label>
          <div class="relative">
            <span
              class="text-body pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
            >
              {{ getCurrencySymbol(authStore.defaultCurrency) }}
            </span>
            <input
              id="starting-balance"
              :value="startingBalance"
              type="number"
              step="0.01"
              placeholder="0.00"
              class="h-12 w-full rounded-xl border border-border bg-surface-muted px-4 pl-8 text-right text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              @input="onBalanceInput"
            />
          </div>
          <p class="text-caption mt-1 text-text-muted">
            Accepts negative values for credit card debt
          </p>
        </div>

        <!-- Icon picker -->
        <div class="mb-6">
          <p class="text-caption mb-1.5 font-medium text-text-secondary">Icon (optional)</p>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="icon in ICON_OPTIONS"
              :key="icon"
              type="button"
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl transition-all duration-150"
              :class="
                selectedIcon === icon
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface bg-surface-muted'
                  : 'bg-surface-muted hover:bg-surface-elevated'
              "
              :aria-label="`Select icon ${icon}`"
              :aria-pressed="selectedIcon === icon"
              @click="selectedIcon = selectedIcon === icon ? null : icon"
            >
              {{ icon }}
            </button>
          </div>
        </div>

        <!-- Error message -->
        <div
          v-if="submitError"
          class="text-body mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger"
          role="alert"
        >
          {{ submitError }}
        </div>

        <!-- Submit button -->
        <button
          type="button"
          class="flex h-12 w-full items-center justify-center rounded-xl font-semibold text-white transition-opacity duration-150"
          :style="{ backgroundColor: 'var(--color-primary)' }"
          :disabled="!isFormValid || isSubmitting"
          :class="{ 'cursor-not-allowed opacity-50': !isFormValid || isSubmitting }"
          @click="handleSubmit"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
            <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Creating…
          </span>
          <span v-else>Create Account</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
