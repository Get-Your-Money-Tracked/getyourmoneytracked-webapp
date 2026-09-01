<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import type { Category } from '@/types'
import { useBudgetsStore } from '@/stores/budgets'
import { getCurrencySymbol } from '@/utils/currency'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'

const props = defineProps<{
  open: boolean
  categories: Category[]
  currency: string
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const budgetsStore = useBudgetsStore()

// ── Currency symbol ───────────────────────────────────────────
const currencySymbol = computed(() => getCurrencySymbol(props.currency))

// ── Form state ────────────────────────────────────────────────
const selectedCategoryId = ref<string>('')
const budgetName = ref<string>('')
const amountInput = ref<string>('')
const isRecurring = ref(false)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const amountError = ref<string | null>(null)

// ── Available categories (exclude already-budgeted) ───────────
const availableCategories = computed(() =>
  props.categories.filter((c) => !budgetsStore.budgetedCategoryIds.has(c.id)),
)

// ── Validation ────────────────────────────────────────────────
const parsedAmount = computed(() => {
  const v = parseFloat(amountInput.value)
  return isNaN(v) ? 0 : v
})

const MAX_BUDGET_AMOUNT = 999_999_999.99

const isFormValid = computed(
  () => selectedCategoryId.value !== '' && parsedAmount.value > 0 && parsedAmount.value <= MAX_BUDGET_AMOUNT,
)

function validateAmount(): boolean {
  if (parsedAmount.value <= 0) {
    amountError.value = 'Amount must be greater than 0.'
    return false
  }
  if (parsedAmount.value > MAX_BUDGET_AMOUNT) {
    amountError.value = 'Amount is too large.'
    return false
  }
  amountError.value = null
  return true
}

// ── Reset on open ─────────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      selectedCategoryId.value = ''
      budgetName.value = ''
      amountInput.value = ''
      isRecurring.value = false
      isSubmitting.value = false
      submitError.value = null
      amountError.value = null
    }
  },
)

// ── Submit ────────────────────────────────────────────────────
async function handleSubmit() {
  if (!validateAmount()) return
  if (!selectedCategoryId.value) return

  isSubmitting.value = true
  submitError.value = null
  try {
    await budgetsStore.createBudget({
      categoryId: selectedCategoryId.value,
      amount: parsedAmount.value,
      name: budgetName.value || undefined,
      ...(isRecurring.value ? { recurring: true } : {}),
    })
    emit('created')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to create budget.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <ResponsiveSheet :open="open" title="Create Budget" test-id="create-budget-sheet" @close="$emit('close')">
    <div class="px-5 pb-8 pt-4">
      <!-- Budget name (optional) -->
      <div class="mb-4">
        <label
          for="create-budget-name"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Name
        </label>
        <input
          id="create-budget-name"
          v-model="budgetName"
          type="text"
          placeholder="Budget name (optional — defaults to category)"
          maxlength="100"
          class="h-12 w-full rounded-xl border border-border bg-surface px-4 text-body text-text-primary placeholder:text-text-muted outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
          data-testid="budget-name-input"
        />
      </div>

      <!-- Category picker -->
      <div class="mb-4">
        <label
          for="create-budget-category"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Category
        </label>
        <div class="relative">
          <select
            id="create-budget-category"
            v-model="selectedCategoryId"
            class="h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-body text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
            data-testid="category-select"
          >
            <option value="" disabled>Select a category</option>
            <option
              v-for="cat in availableCategories"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.icon ?? '' }} {{ cat.name }}
            </option>
            <!-- Disabled: already-budgeted categories -->
            <option
              v-for="cat in categories.filter(c => budgetsStore.budgetedCategoryIds.has(c.id))"
              :key="`budgeted-${cat.id}`"
              :value="cat.id"
              disabled
              class="opacity-50"
            >
              {{ cat.icon ?? '' }} {{ cat.name }} (budgeted)
            </option>
          </select>
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      <!-- Amount input -->
      <div class="mb-6">
        <label
          for="create-budget-amount"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Monthly Limit
        </label>
        <div
          class="flex h-12 items-center rounded-xl border bg-surface transition-colors"
          :class="amountError ? 'border-danger ring-2 ring-danger' : 'border-border focus-within:ring-2 focus-within:ring-primary focus-within:border-primary'"
        >
          <span class="pl-4 pr-1 text-body text-text-muted">{{ currencySymbol }}</span>
          <input
            id="create-budget-amount"
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

      <!-- Submit error -->
	  <label class="mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-muted p-4">
	    <input v-model="isRecurring" type="checkbox" class="mt-1 h-4 w-4 accent-primary" data-testid="recurring-budget-checkbox" />
	    <span>
	      <span class="text-body block font-medium text-text-primary">Repeat every month</span>
	      <span class="text-caption block text-text-secondary">Use this limit from this month onward.</span>
	    </span>
	  </label>

	  <!-- Submit error -->
      <p v-if="submitError" class="text-caption mb-3 text-danger" role="alert" data-testid="submit-error">
        {{ submitError }}
      </p>

      <!-- Create button -->
      <button
        type="button"
        class="flex h-12 w-full items-center justify-center gap-2 rounded-xl font-medium text-white transition-opacity disabled:opacity-50"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        :disabled="!isFormValid || isSubmitting"
        data-testid="create-submit-btn"
        @click="handleSubmit"
      >
        <Loader2 v-if="isSubmitting" :size="18" class="animate-spin" />
        {{ isSubmitting ? 'Creating...' : 'Create Budget' }}
      </button>
    </div>
  </ResponsiveSheet>
</template>
