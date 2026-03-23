<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useGoalsStore } from '@/stores/goals'
import { getCurrencySymbol } from '@/utils/currency'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'

const ICONS = ['✈️', '🏠', '🚗', '☂️', '🐷', '🎁', '🎓', '❤️']

const props = defineProps<{
  open: boolean
  currency?: string
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const goalsStore = useGoalsStore()
const currencySymbol = computed(() => getCurrencySymbol(props.currency ?? 'USD'))

// ── Form state ────────────────────────────────────────────────
const nameInput = ref<string>('')
const targetAmountInput = ref<string>('')
const currentAmountInput = ref<string>('')
const targetMonthInput = ref<string>('') // YYYY-MM from <input type="month">
const selectedIcon = ref<string | null>(null)

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const nameError = ref<string | null>(null)
const targetAmountError = ref<string | null>(null)
const currentAmountError = ref<string | null>(null)

// ── Computed ──────────────────────────────────────────────────
const parsedTargetAmount = computed(() => {
  const v = parseFloat(targetAmountInput.value)
  return isNaN(v) ? 0 : v
})

const parsedCurrentAmount = computed(() => {
  const v = parseFloat(currentAmountInput.value)
  return isNaN(v) ? 0 : v
})

const isFormValid = computed(() => {
  if (!nameInput.value.trim()) return false
  if (parsedTargetAmount.value <= 0) return false
  if (parsedCurrentAmount.value < 0) return false
  return true
})

// ── Reset on open ─────────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      nameInput.value = ''
      targetAmountInput.value = ''
      currentAmountInput.value = ''
      targetMonthInput.value = ''
      selectedIcon.value = null
      isSubmitting.value = false
      submitError.value = null
      nameError.value = null
      targetAmountError.value = null
      currentAmountError.value = null
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

function validateTargetAmount(): boolean {
  if (parsedTargetAmount.value <= 0) {
    targetAmountError.value = 'Target amount must be greater than 0.'
    return false
  }
  targetAmountError.value = null
  return true
}

function validateCurrentAmount(): boolean {
  if (parsedCurrentAmount.value < 0) {
    currentAmountError.value = 'Current amount cannot be negative.'
    return false
  }
  currentAmountError.value = null
  return true
}

// ── Compute target date from month input (first day of month) ──
function getTargetDate(): string | null {
  if (!targetMonthInput.value) return null
  // targetMonthInput is "YYYY-MM"; target date = first day of that month
  return `${targetMonthInput.value}-01`
}

// ── Submit ────────────────────────────────────────────────────
async function handleSubmit() {
  const validName = validateName()
  const validTarget = validateTargetAmount()
  const validCurrent = validateCurrentAmount()
  if (!validName || !validTarget || !validCurrent) return

  isSubmitting.value = true
  submitError.value = null
  try {
    await goalsStore.createGoal({
      name: nameInput.value.trim(),
      targetAmount: parsedTargetAmount.value,
      currentAmount: parsedCurrentAmount.value || undefined,
      targetDate: getTargetDate(),
      icon: selectedIcon.value,
    })
    emit('created')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to create goal.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <ResponsiveSheet :open="open" title="Add Goal" test-id="add-goal-sheet" @close="$emit('close')">
    <div class="px-5 pb-8 pt-4">
      <!-- Icon selector -->
      <div class="mb-4">
        <p class="text-caption mb-2 font-medium text-text-secondary">Icon (optional)</p>
        <div class="grid grid-cols-6 gap-2" data-testid="icon-selector">
          <button
            v-for="icon in ICONS"
            :key="icon"
            type="button"
            class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-xl transition-colors"
            :class="selectedIcon === icon
              ? 'bg-primary/15 ring-2 ring-primary'
              : 'bg-surface-muted hover:bg-surface-elevated'"
            :data-testid="`icon-btn-${icon}`"
            @click="selectedIcon = selectedIcon === icon ? null : icon"
          >
            {{ icon }}
          </button>
        </div>
      </div>

      <!-- Name input -->
      <div class="mb-4">
        <label for="add-goal-name" class="text-caption mb-1 block font-medium text-text-secondary">
          Goal Name
        </label>
        <input
          id="add-goal-name"
          v-model="nameInput"
          type="text"
          maxlength="100"
          placeholder="e.g. Emergency Fund"
          class="h-12 w-full rounded-xl border bg-surface px-4 text-body text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
          :class="nameError ? 'border-danger ring-2 ring-danger' : 'border-border focus:border-primary'"
          data-testid="name-input"
          @blur="validateName"
        />
        <p v-if="nameError" class="text-caption mt-1 text-danger" role="alert" data-testid="name-error">
          {{ nameError }}
        </p>
      </div>

      <!-- Target amount -->
      <div class="mb-4">
        <label for="add-goal-target" class="text-caption mb-1 block font-medium text-text-secondary">
          Target Amount
        </label>
        <div
          class="flex h-12 items-center rounded-xl border bg-surface transition-colors"
          :class="targetAmountError ? 'border-danger ring-2 ring-danger' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary'"
        >
          <span class="pl-4 pr-1 text-body text-text-muted">{{ currencySymbol }}</span>
          <input
            id="add-goal-target"
            v-model="targetAmountInput"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            class="h-full flex-1 bg-transparent pr-4 text-right text-section-title font-bold tabular-nums text-text-primary outline-none"
            data-testid="target-amount-input"
            @blur="validateTargetAmount"
          />
        </div>
        <p v-if="targetAmountError" class="text-caption mt-1 text-danger" role="alert" data-testid="target-amount-error">
          {{ targetAmountError }}
        </p>
      </div>

      <!-- Current amount (optional) -->
      <div class="mb-4">
        <label for="add-goal-current" class="text-caption mb-1 block font-medium text-text-secondary">
          Already Saved <span class="text-text-muted">(optional)</span>
        </label>
        <div
          class="flex h-12 items-center rounded-xl border bg-surface transition-colors"
          :class="currentAmountError ? 'border-danger ring-2 ring-danger' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary'"
        >
          <span class="pl-4 pr-1 text-body text-text-muted">{{ currencySymbol }}</span>
          <input
            id="add-goal-current"
            v-model="currentAmountInput"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            class="h-full flex-1 bg-transparent pr-4 text-right text-section-title font-bold tabular-nums text-text-primary outline-none"
            data-testid="current-amount-input"
            @blur="validateCurrentAmount"
          />
        </div>
        <p v-if="currentAmountError" class="text-caption mt-1 text-danger" role="alert" data-testid="current-amount-error">
          {{ currentAmountError }}
        </p>
      </div>

      <!-- Target date (optional) -->
      <div class="mb-4">
        <label for="add-goal-date" class="text-caption mb-1 block font-medium text-text-secondary">
          Target Date <span class="text-text-muted">(optional)</span>
        </label>
        <input
          id="add-goal-date"
          v-model="targetMonthInput"
          type="month"
          class="h-12 w-full rounded-xl border border-border bg-surface px-4 text-body text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary"
          data-testid="target-date-input"
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
        data-testid="add-goal-submit-btn"
        @click="handleSubmit"
      >
        <Loader2 v-if="isSubmitting" :size="18" class="animate-spin" />
        {{ isSubmitting ? 'Adding...' : 'Add Goal' }}
      </button>
    </div>
  </ResponsiveSheet>
</template>
