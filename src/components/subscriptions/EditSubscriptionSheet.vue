<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import type { SubscriptionEntry, Category, Account } from '@/types'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { useToastStore } from '@/stores/toast'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'

const props = defineProps<{
  open: boolean
  subscription: SubscriptionEntry | null
  categories: Category[]
  accounts: Account[]
  currency: string
}>()

const emit = defineEmits<{
  close: []
  saved: []
  deleted: []
}>()

const subscriptionsStore = useSubscriptionsStore()
const toastStore = useToastStore()

// ── Form state ────────────────────────────────────────────────
const nameInput = ref<string>('')
const typeInput = ref<'EXPENSE' | 'INCOME'>('EXPENSE')
const amountInput = ref<string>('')
const selectedCategoryId = ref<string>('')
const selectedAccountId = ref<string>('')
const frequencyInput = ref<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY')
const dayOfMonthInput = ref<string>('1')
const isActiveInput = ref<boolean>(true)
const autoLogInput = ref<boolean>(false)
const includeCurrentMonthInput = ref<boolean>(false)

const isUpdating = ref(false)
const isDeleting = ref(false)
const updateError = ref<string | null>(null)
const amountError = ref<string | null>(null)
const nameError = ref<string | null>(null)
const dayOfMonthError = ref<string | null>(null)
const showDeleteConfirm = ref(false)

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

const nextDueInFutureMonth = computed(() => {
  if (!showDayOfMonth.value || !props.subscription?.nextDueDate) return false
  const today = new Date()
  const nextDue = new Date(props.subscription.nextDueDate)
  return nextDue.getMonth() !== today.getMonth() || nextDue.getFullYear() !== today.getFullYear()
})

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

// ── Pre-fill on open ──────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.subscription) {
      const s = props.subscription
      nameInput.value = s.name
      typeInput.value = s.type === 'INCOME' ? 'INCOME' : 'EXPENSE'
      amountInput.value = s.amount.toFixed(2)
      selectedCategoryId.value = s.category?.id ?? ''
      selectedAccountId.value = s.account.id
      frequencyInput.value = s.frequency
      dayOfMonthInput.value = s.dayOfMonth?.toString() ?? '1'
      isActiveInput.value = s.isActive
      autoLogInput.value = s.autoLog
      includeCurrentMonthInput.value = false
      isUpdating.value = false
      isDeleting.value = false
      updateError.value = null
      amountError.value = null
      nameError.value = null
      dayOfMonthError.value = null
      showDeleteConfirm.value = false
    }
  },
  { immediate: true },
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

// ── Update ────────────────────────────────────────────────────
async function handleUpdate() {
  const validName = validateName()
  const validAmount = validateAmount()
  const validDay = validateDayOfMonth()
  if (!validName || !validAmount || !validDay || !props.subscription) return

  isUpdating.value = true
  updateError.value = null
  try {
    await subscriptionsStore.updateSubscription(props.subscription.id, {
      name: nameInput.value.trim(),
      amount: parsedAmount.value,
      categoryId: selectedCategoryId.value,
      accountId: selectedAccountId.value,
      frequency: frequencyInput.value,
      dayOfMonth: showDayOfMonth.value ? parsedDayOfMonth.value : null,
      isActive: isActiveInput.value,
      autoLog: autoLogInput.value,
      includeCurrentMonth: includeCurrentMonthInput.value || undefined,
    })
    emit('saved')
    emit('close')
  } catch (e: unknown) {
    updateError.value = (e as Error).message ?? 'Failed to update subscription.'
  } finally {
    isUpdating.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────
function requestDelete() {
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
}

async function confirmDelete() {
  if (!props.subscription) return
  isDeleting.value = true
  // Snapshot for undo before deleting
  const snapshot = { ...props.subscription }
  try {
    await subscriptionsStore.deleteSubscription(props.subscription.id)
    showDeleteConfirm.value = false
    emit('deleted')
    emit('close')
    toastStore.show(
      'Recurring item deleted',
      'success',
      5000,
      {
        label: 'Undo',
        callback: () => {
          subscriptionsStore.createSubscription({
            name: snapshot.name,
            type: (snapshot.type === 'TRANSFER' ? 'EXPENSE' : snapshot.type) as 'EXPENSE' | 'INCOME',
            amount: snapshot.amount,
            categoryId: snapshot.category?.id ?? '',
            accountId: snapshot.account.id,
            frequency: snapshot.frequency,
            dayOfMonth: snapshot.dayOfMonth,
          }).catch(() => {/* undo failed silently */})
        },
      },
    )
  } catch (e: unknown) {
    updateError.value = (e as Error).message ?? 'Failed to delete subscription.'
    showDeleteConfirm.value = false
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <!-- Delete confirmation dialog (above the sheet) -->
  <Transition name="backdrop">
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-6"
    >
      <div
        class="w-full max-w-sm rounded-2xl bg-surface p-6"
        :style="{ boxShadow: 'var(--shadow-sheet)' }"
        role="alertdialog"
        aria-modal="true"
        aria-label="Delete this subscription?"
        data-testid="delete-confirm-dialog"
      >
        <h3 class="text-section-title mb-2 font-semibold text-text-primary">Delete this subscription?</h3>
        <p class="text-body mb-6 text-text-secondary">
          Remove {{ subscription?.name }}? Upcoming reminders will be removed.
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="text-body h-11 flex-1 rounded-xl border border-border font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            data-testid="delete-cancel-btn"
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button
            type="button"
            class="text-body h-11 flex-1 rounded-xl font-medium text-white transition-opacity disabled:opacity-50"
            :style="{ backgroundColor: 'var(--color-danger)' }"
            :disabled="isDeleting"
            data-testid="delete-confirm-btn"
            @click="confirmDelete"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <ResponsiveSheet :open="open" title="Edit Subscription" test-id="edit-subscription-sheet" @close="$emit('close')">
    <div class="px-5 pb-8 pt-4">
      <!-- Name input -->
      <div class="mb-4">
        <label
          for="edit-sub-name"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Name
        </label>
        <input
          id="edit-sub-name"
          v-model="nameInput"
          type="text"
          maxlength="100"
          class="h-12 w-full rounded-xl border bg-surface px-4 text-body text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
          :class="nameError ? 'border-danger ring-2 ring-danger' : 'border-border focus:border-primary'"
          data-testid="edit-name-input"
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
          for="edit-sub-amount"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Amount
        </label>
        <div
          class="flex h-12 items-center rounded-xl border bg-surface transition-colors"
          :class="amountError ? 'border-danger ring-2 ring-danger' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary'"
        >
          <span class="pl-4 pr-1 text-body text-text-muted">$</span>
          <input
            id="edit-sub-amount"
            v-model="amountInput"
            type="number"
            step="0.01"
            min="0.01"
            class="h-full flex-1 bg-transparent pr-4 text-right text-section-title font-bold tabular-nums text-text-primary outline-none"
            data-testid="edit-amount-input"
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
          for="edit-sub-category"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Category
        </label>
        <div class="relative">
          <select
            id="edit-sub-category"
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
          for="edit-sub-account"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Account
        </label>
        <div class="relative">
          <select
            id="edit-sub-account"
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
          for="edit-sub-day"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Day of Month
        </label>
        <input
          id="edit-sub-day"
          v-model="dayOfMonthInput"
          type="number"
          min="1"
          max="31"
          class="h-12 w-full rounded-xl border bg-surface px-4 text-body text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
          :class="dayOfMonthError ? 'border-danger ring-2 ring-danger' : 'border-border focus:border-primary'"
          data-testid="day-of-month-input"
          @blur="validateDayOfMonth"
        />
        <p v-if="dayOfMonthError" class="text-caption mt-1 text-danger" role="alert" data-testid="day-of-month-error">
          {{ dayOfMonthError }}
        </p>
      </div>

      <!-- Active / Inactive toggle -->
      <div class="mb-4">
        <p class="text-caption mb-1 font-medium text-text-secondary">Status</p>
        <div class="flex h-10 overflow-hidden rounded-xl border border-border">
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-1.5 text-body font-medium transition-colors"
            :class="isActiveInput ? 'text-white' : 'bg-surface text-text-secondary'"
            :style="isActiveInput ? { backgroundColor: 'var(--color-primary)' } : {}"
            data-testid="status-active-btn"
            @click="isActiveInput = true"
          >
            <div class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            Active
          </button>
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-1.5 text-body font-medium transition-colors"
            :class="!isActiveInput ? 'text-white' : 'bg-surface text-text-secondary'"
            :style="!isActiveInput ? { backgroundColor: 'var(--color-text-muted)' } : {}"
            data-testid="status-inactive-btn"
            @click="isActiveInput = false"
          >
            <div class="h-1.5 w-1.5 rounded-full border border-current" aria-hidden="true" />
            Inactive
          </button>
        </div>
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

      <!-- Include current month toggle (when nextDueDate is in a future month) -->
      <div
        v-if="nextDueInFutureMonth"
        class="mb-4 flex items-center justify-between rounded-xl px-4 py-3 bg-surface-muted"
        data-testid="include-current-month-section"
      >
        <div>
          <p class="text-body text-text-primary">Move to this month</p>
          <p class="text-caption text-text-secondary">Next due is {{ subscription?.nextDueDate }} — include this month?</p>
        </div>
        <input
          v-model="includeCurrentMonthInput"
          type="checkbox"
          class="h-5 w-5 rounded accent-primary"
          data-testid="include-current-month-toggle"
        />
      </div>

      <!-- Error message -->
      <p v-if="updateError" class="text-caption mb-3 text-danger" role="alert" data-testid="update-error">
        {{ updateError }}
      </p>

      <!-- Update button -->
      <button
        type="button"
        class="mb-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-medium text-white transition-opacity disabled:opacity-50"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        :disabled="!isFormValid || isUpdating"
        data-testid="update-btn"
        @click="handleUpdate"
      >
        <Loader2 v-if="isUpdating" :size="18" class="animate-spin" />
        {{ isUpdating ? 'Updating...' : 'Update' }}
      </button>

      <!-- Delete button -->
      <button
        type="button"
        class="text-body h-10 w-full rounded-xl font-medium transition-colors hover:bg-danger/10"
        :style="{ color: 'var(--color-danger)' }"
        data-testid="delete-btn"
        @click="requestDelete"
      >
        Delete Subscription
      </button>
    </div>
  </ResponsiveSheet>
</template>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
</style>
