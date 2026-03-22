<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import type { Category } from '@/types'
import { useBudgetsStore } from '@/stores/budgets'

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

// ── Form state ────────────────────────────────────────────────
const selectedCategoryId = ref<string>('')
const amountInput = ref<string>('')
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

const isFormValid = computed(
  () => selectedCategoryId.value !== '' && parsedAmount.value > 0,
)

function validateAmount(): boolean {
  if (parsedAmount.value <= 0) {
    amountError.value = 'Amount must be greater than 0.'
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
      amountInput.value = ''
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
    })
    emit('created')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to create budget.'
  } finally {
    isSubmitting.value = false
  }
}

// ── Swipe-to-dismiss ──────────────────────────────────────────
let touchStartY = 0
function onTouchStart(e: TouchEvent) { touchStartY = e.touches[0].clientY }
function onTouchEnd(e: TouchEvent) {
  if (e.changedTouches[0].clientY - touchStartY > 80) emit('close')
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
      class="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-surface pb-safe"
      :style="{ boxShadow: 'var(--shadow-sheet)' }"
      role="dialog"
      aria-modal="true"
      aria-label="Create Budget"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <div class="px-5 pb-8 pt-4">
        <!-- Drag handle -->
        <div class="mb-5 flex justify-center">
          <div class="h-1 w-8 rounded-full bg-border" aria-hidden="true" />
        </div>

        <!-- Title -->
        <h2 class="text-section-title mb-5 font-semibold text-text-primary">Create Budget</h2>

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
            <span class="pl-4 pr-1 text-body text-text-muted">$</span>
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
    </div>
  </Transition>
</template>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
.sheet-enter-active, .sheet-leave-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }
</style>
