<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Lock, AlertTriangle, Loader2 } from 'lucide-vue-next'
import type { Budget } from '@/types'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { formatCurrency } from '@/utils/currency'
import { useBudgetsStore } from '@/stores/budgets'
import { useToastStore } from '@/stores/toast'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'

const props = defineProps<{
  open: boolean
  budget: Budget | null
  currency: string
}>()

const emit = defineEmits<{
  close: []
  saved: []
  deleted: []
}>()

const budgetsStore = useBudgetsStore()
const toastStore = useToastStore()

// ── Form state ────────────────────────────────────────────────
const amountInput = ref<string>('')
const nameInput = ref<string>('')
const isUpdating = ref(false)
const isDeleting = ref(false)
const updateError = ref<string | null>(null)
const amountError = ref<string | null>(null)
const showDeleteConfirm = ref(false)

// ── Computed ─────────────────────────────────────────────────
const parsedAmount = computed(() => {
  const v = parseFloat(amountInput.value)
  return isNaN(v) ? 0 : v
})

const isAmountChanged = computed(() =>
  props.budget !== null && parsedAmount.value !== props.budget.amount,
)

const isNameChanged = computed(() =>
  props.budget !== null && nameInput.value !== props.budget.name,
)

const isFormValid = computed(() => parsedAmount.value > 0 && (isAmountChanged.value || isNameChanged.value))

const isOverBudgetWarning = computed(() =>
  props.budget !== null && parsedAmount.value > 0 && parsedAmount.value < props.budget.spent,
)

const formattedMonth = computed(() => {
  if (!props.budget) return ''
  const [year, month] = props.budget.month.split('-')
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
})

const spentPercent = computed(() =>
  props.budget && props.budget.amount > 0
    ? (props.budget.spent / props.budget.amount) * 100
    : 0,
)

const formattedSpent = computed(() =>
  props.budget ? formatCurrency(props.budget.spent, props.currency) : '',
)
const formattedAmount = computed(() =>
  props.budget ? formatCurrency(props.budget.amount, props.currency) : '',
)

// ── Pre-fill on open ──────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.budget) {
      amountInput.value = props.budget.amount.toFixed(2)
      nameInput.value = props.budget.name
      isUpdating.value = false
      isDeleting.value = false
      updateError.value = null
      amountError.value = null
      showDeleteConfirm.value = false
    }
  },
  { immediate: true },
)

// ── Validation ────────────────────────────────────────────────
function validateAmount(): boolean {
  if (parsedAmount.value <= 0) {
    amountError.value = 'Amount must be greater than 0.'
    return false
  }
  amountError.value = null
  return true
}

// ── Update ────────────────────────────────────────────────────
async function handleUpdate() {
  if (!validateAmount() || !props.budget) return
  isUpdating.value = true
  updateError.value = null
  try {
    await budgetsStore.updateBudget(props.budget.id, {
      amount: parsedAmount.value,
      name: isNameChanged.value ? nameInput.value : undefined,
    })
    emit('saved')
    emit('close')
  } catch (e: unknown) {
    updateError.value = (e as Error).message ?? 'Failed to update budget.'
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
  if (!props.budget) return
  isDeleting.value = true
  // Snapshot for undo before deleting
  const snapshot = { ...props.budget }
  try {
    await budgetsStore.deleteBudget(props.budget.id)
    showDeleteConfirm.value = false
    emit('deleted')
    emit('close')
    toastStore.show(
      'Budget deleted',
      'success',
      5000,
      {
        label: 'Undo',
        callback: () => {
          budgetsStore.createBudget({
            categoryId: snapshot.category.id,
            amount: snapshot.amount,
            month: snapshot.month,
            name: snapshot.name || undefined,
          }).catch(() => {/* undo failed silently */})
        },
      },
    )
  } catch (e: unknown) {
    updateError.value = (e as Error).message ?? 'Failed to delete budget.'
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
        aria-label="Delete this budget?"
        data-testid="delete-confirm-dialog"
      >
        <h3 class="text-section-title mb-2 font-semibold text-text-primary">Delete this budget?</h3>
        <p class="text-body mb-6 text-text-secondary">
          Remove the {{ formattedAmount }} budget for {{ budget?.name || budget?.category.name }}?
          Your transactions won't be affected.
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

  <ResponsiveSheet :open="open" title="Edit Budget" test-id="edit-budget-sheet" @close="$emit('close')">
    <div class="px-5 pb-8 pt-4">
      <!-- Budget name -->
      <div class="mb-4">
        <label
          for="edit-budget-name"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Name
        </label>
        <input
          id="edit-budget-name"
          v-model="nameInput"
          type="text"
          placeholder="Budget name (optional — defaults to category)"
          maxlength="100"
          class="h-12 w-full rounded-xl border border-border bg-surface px-4 text-body text-text-primary placeholder:text-text-muted outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
          data-testid="edit-budget-name-input"
        />
      </div>

      <!-- Category (read-only) -->
      <div class="mb-4">
        <label class="text-caption mb-1 block font-medium text-text-secondary">Category</label>
        <div
          class="flex h-12 cursor-not-allowed items-center gap-2 rounded-xl bg-surface-muted px-4 opacity-70"
          data-testid="readonly-category"
        >
          <Lock :size="14" class="text-text-muted" aria-hidden="true" />
          <span class="text-body">{{ budget?.category.icon ?? '' }} {{ budget?.category.name }}</span>
        </div>
      </div>

      <!-- Month (read-only) -->
      <div class="mb-4">
        <label class="text-caption mb-1 block font-medium text-text-secondary">Month</label>
        <div
          class="flex h-12 cursor-not-allowed items-center gap-2 rounded-xl bg-surface-muted px-4 opacity-70"
          data-testid="readonly-month"
        >
          <Lock :size="14" class="text-text-muted" aria-hidden="true" />
          <span class="text-body">{{ formattedMonth }}</span>
        </div>
      </div>

      <!-- Current spending (read-only info) -->
      <div class="mb-4">
        <label class="text-caption mb-1 block font-medium text-text-secondary">Current Spending</label>
        <div class="rounded-xl bg-surface-muted p-3" data-testid="current-spending">
          <p class="text-body font-medium tabular-nums">
            <span>{{ formattedSpent }}</span>
            <span class="text-text-muted"> of {{ formattedAmount }}</span>
            <span class="ml-1 text-caption text-text-muted">({{ Math.round(spentPercent) }}%)</span>
          </p>
          <div class="mt-2">
            <ProgressBar :percent="spentPercent" />
          </div>
        </div>
      </div>

      <!-- Amount input -->
      <div class="mb-4">
        <label
          for="edit-budget-amount"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Monthly Limit
        </label>
        <div
          class="flex h-12 items-center rounded-xl border bg-surface transition-colors"
          :class="amountError ? 'border-danger ring-2 ring-danger' : 'border-border focus-within:ring-2 focus-within:ring-primary focus-within:border-primary'"
        >
          <span class="pl-4 pr-1 text-body text-text-muted">$</span>
          <input
            id="edit-budget-amount"
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

      <!-- Over-budget warning -->
      <div
        v-if="isOverBudgetWarning"
        class="mb-4 flex items-center gap-2"
        data-testid="over-budget-warning"
      >
        <AlertTriangle :size="14" class="text-warning" aria-hidden="true" />
        <span class="text-caption text-warning">This limit is already exceeded.</span>
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
        Delete Budget
      </button>
    </div>
  </ResponsiveSheet>
</template>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
</style>
