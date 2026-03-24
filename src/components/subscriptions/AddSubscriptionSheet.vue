<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import type { Category, Account } from '@/types'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { getCurrencySymbol } from '@/utils/currency'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'

const props = defineProps<{
  open: boolean
  categories: Category[]
  accounts: Account[]
  currency: string
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const subscriptionsStore = useSubscriptionsStore()

// ── Currency symbol ───────────────────────────────────────────
const currencySymbol = computed(() => getCurrencySymbol(props.currency))

// ── Form state ────────────────────────────────────────────────
const nameInput = ref<string>('')
const typeInput = ref<'EXPENSE' | 'INCOME'>('EXPENSE')
const amountInput = ref<string>('')
const selectedCategoryId = ref<string>('')
const selectedAccountId = ref<string>('')
const frequencyInput = ref<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY')
const dayOfMonthInput = ref<string>('1')
const autoLogInput = ref<boolean>(false)

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const amountError = ref<string | null>(null)
const nameError = ref<string | null>(null)
const dayOfMonthError = ref<string | null>(null)

// ── Computed ──────────────────────────────────────────────────
const parsedAmount = computed(() => {
  const v = parseFloat(amountInput.value)
  return isNaN(v) ? 0 : v
})

const parsedDayOfMonth = computed(() => {
  const v = parseInt(dayOfMonthInput.value)
  return isNaN(v) ? 1 : v
})

const showDayOfMonth = computed(() => frequencyInput.value === 'MONTHLY')

const defaultAccount = computed(() => props.accounts.find((a) => a.isDefault) ?? props.accounts[0] ?? null)

const isFormValid = computed(() => {
  if (!nameInput.value.trim()) return false
  if (parsedAmount.value <= 0) return false
  if (!selectedCategoryId.value) return false
  if (!selectedAccountId.value) return false
  if (showDayOfMonth.value) {
    const d = parsedDayOfMonth.value
    if (d < 1 || d > 31) return false
  }
  return true
})

// ── Reset on open ─────────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      nameInput.value = ''
      typeInput.value = 'EXPENSE'
      amountInput.value = ''
      selectedCategoryId.value = ''
      selectedAccountId.value = defaultAccount.value?.id ?? ''
      frequencyInput.value = 'MONTHLY'
      dayOfMonthInput.value = '1'
      autoLogInput.value = false
      isSubmitting.value = false
      submitError.value = null
      amountError.value = null
      nameError.value = null
      dayOfMonthError.value = null
    }
  },
)

// ── Validation ────────────────────────────────────────────────
function validateName(): boolean {
  const trimmed = nameInput.value.trim()
  if (!trimmed) {
    nameError.value = 'Name is required.'
    return false
  }
  if (trimmed.length > 100) {
    nameError.value = 'Name must be 100 characters or fewer.'
    return false
  }
  nameError.value = null
  return true
}

function validateAmount(): boolean {
  if (parsedAmount.value <= 0) {
    amountError.value = 'Amount must be greater than 0.'
    return false
  }
  amountError.value = null
  return true
}

function validateDayOfMonth(): boolean {
  if (!showDayOfMonth.value) {
    dayOfMonthError.value = null
    return true
  }
  const d = parsedDayOfMonth.value
  if (d < 1 || d > 31) {
    dayOfMonthError.value = 'Day must be between 1 and 31.'
    return false
  }
  dayOfMonthError.value = null
  return true
}

// ── Submit ────────────────────────────────────────────────────
async function handleSubmit() {
  const validName = validateName()
  const validAmount = validateAmount()
  const validDay = validateDayOfMonth()
  if (!validName || !validAmount || !validDay) return
  if (!selectedCategoryId.value || !selectedAccountId.value) return

  isSubmitting.value = true
  submitError.value = null
  try {
    await subscriptionsStore.createSubscription({
      name: nameInput.value.trim(),
      type: typeInput.value,
      amount: parsedAmount.value,
      categoryId: selectedCategoryId.value,
      accountId: selectedAccountId.value,
      frequency: frequencyInput.value,
      dayOfMonth: showDayOfMonth.value ? parsedDayOfMonth.value : null,
      autoLog: autoLogInput.value,
    })
    emit('created')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to create subscription.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <ResponsiveSheet :open="open" title="Add Subscription" test-id="add-subscription-sheet" @close="$emit('close')">
    <div class="px-5 pb-8 pt-4">
      <!-- Name input -->
      <div class="mb-4">
        <label
          for="add-sub-name"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Name
        </label>
        <input
          id="add-sub-name"
          v-model="nameInput"
          type="text"
          maxlength="100"
          placeholder="e.g. Netflix"
          class="h-12 w-full rounded-xl border bg-surface px-4 text-body text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
          :class="nameError ? 'border-danger ring-2 ring-danger' : 'border-border focus:border-primary'"
          data-testid="name-input"
          @blur="validateName"
        />
        <p v-if="nameError" class="text-caption mt-1 text-danger" role="alert" data-testid="name-error">
          {{ nameError }}
        </p>
      </div>

      <!-- Type toggle -->
      <div class="mb-4">
        <p class="text-caption mb-1 font-medium text-text-secondary">Type</p>
        <div class="flex h-10 overflow-hidden rounded-xl border border-border">
          <button
            type="button"
            class="flex-1 text-body font-medium transition-colors"
            :class="typeInput === 'EXPENSE' ? 'text-white' : 'bg-surface text-text-secondary'"
            :style="typeInput === 'EXPENSE' ? { backgroundColor: 'var(--color-danger)' } : {}"
            data-testid="type-expense-btn"
            @click="typeInput = 'EXPENSE'"
          >
            Expense
          </button>
          <button
            type="button"
            class="flex-1 text-body font-medium transition-colors"
            :class="typeInput === 'INCOME' ? 'text-white' : 'bg-surface text-text-secondary'"
            :style="typeInput === 'INCOME' ? { backgroundColor: 'var(--color-primary)' } : {}"
            data-testid="type-income-btn"
            @click="typeInput = 'INCOME'"
          >
            Income
          </button>
        </div>
      </div>

      <!-- Amount input -->
      <div class="mb-4">
        <label
          for="add-sub-amount"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Amount
        </label>
        <div
          class="flex h-12 items-center rounded-xl border bg-surface transition-colors"
          :class="amountError ? 'border-danger ring-2 ring-danger' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary'"
        >
          <span class="pl-4 pr-1 text-body text-text-muted">{{ currencySymbol }}</span>
          <input
            id="add-sub-amount"
            v-model="amountInput"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            class="h-full flex-1 bg-transparent pr-4 text-right text-section-title font-bold tabular-nums text-text-primary outline-none"
            data-testid="amount-input"
            @blur="validateAmount"
          />
        </div>
        <p v-if="amountError" class="text-caption mt-1 text-danger" role="alert" data-testid="amount-error">
          {{ amountError }}
        </p>
      </div>

      <!-- Category picker -->
      <div class="mb-4">
        <label
          for="add-sub-category"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Category
        </label>
        <div class="relative">
          <select
            id="add-sub-category"
            v-model="selectedCategoryId"
            class="h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-body text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
            data-testid="category-select"
          >
            <option value="" disabled>Select a category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.icon ?? '' }} {{ cat.name }}
            </option>
          </select>
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      <!-- Account picker -->
      <div class="mb-4">
        <label
          for="add-sub-account"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Account
        </label>
        <div class="relative">
          <select
            id="add-sub-account"
            v-model="selectedAccountId"
            class="h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-body text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
            data-testid="account-select"
          >
            <option value="" disabled>Select an account</option>
            <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
              {{ acc.icon ?? '' }} {{ acc.name }}{{ acc.isDefault ? ' (default)' : '' }}
            </option>
          </select>
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      <!-- Frequency toggle -->
      <div class="mb-4">
        <p class="text-caption mb-1 font-medium text-text-secondary">Frequency</p>
        <div class="flex h-10 overflow-hidden rounded-xl border border-border">
          <button
            v-for="(label, freq) in { MONTHLY: 'Monthly', WEEKLY: 'Weekly', YEARLY: 'Yearly' }"
            :key="freq"
            type="button"
            class="flex-1 text-body font-medium transition-colors"
            :class="frequencyInput === freq ? 'text-white' : 'bg-surface text-text-secondary'"
            :style="frequencyInput === freq ? { backgroundColor: 'var(--color-primary)' } : {}"
            :data-testid="`freq-${freq.toLowerCase()}-btn`"
            @click="frequencyInput = freq as 'MONTHLY' | 'WEEKLY' | 'YEARLY'"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <!-- Day of Month (Monthly only) -->
      <div v-if="showDayOfMonth" class="mb-4" data-testid="day-of-month-section">
        <label
          for="add-sub-day"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Day of Month
        </label>
        <input
          id="add-sub-day"
          v-model="dayOfMonthInput"
          type="number"
          min="1"
          max="31"
          placeholder="1"
          class="h-12 w-full rounded-xl border bg-surface px-4 text-body text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
          :class="dayOfMonthError ? 'border-danger ring-2 ring-danger' : 'border-border focus:border-primary'"
          data-testid="day-of-month-input"
          @blur="validateDayOfMonth"
        />
        <p v-if="dayOfMonthError" class="text-caption mt-1 text-danger" role="alert" data-testid="day-of-month-error">
          {{ dayOfMonthError }}
        </p>
      </div>

      <!-- Auto-log toggle -->
      <div class="mb-4 flex items-center justify-between rounded-xl px-4 py-3 bg-surface-muted" data-testid="autolog-section">
        <div>
          <p class="text-body text-text-primary">Prompt me to log this item</p>
          <p class="text-caption text-text-secondary">when it becomes overdue</p>
        </div>
        <input
          v-model="autoLogInput"
          type="checkbox"
          class="h-5 w-5 rounded accent-primary"
          data-testid="autolog-toggle"
        />
      </div>

      <!-- Submit error -->
      <p v-if="submitError" class="text-caption mb-3 text-danger" role="alert" data-testid="submit-error">
        {{ submitError }}
      </p>

      <!-- Submit button -->
      <button
        type="button"
        class="flex h-12 w-full items-center justify-center gap-2 rounded-xl font-medium text-white transition-opacity disabled:opacity-50"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        :disabled="!isFormValid || isSubmitting"
        data-testid="add-submit-btn"
        @click="handleSubmit"
      >
        <Loader2 v-if="isSubmitting" :size="18" class="animate-spin" />
        {{ isSubmitting ? 'Adding...' : 'Add Subscription' }}
      </button>
    </div>
  </ResponsiveSheet>
</template>
