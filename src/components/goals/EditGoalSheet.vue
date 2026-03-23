<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Loader2, Trash2 } from 'lucide-vue-next'
import type { Goal } from '@/types'
import { useGoalsStore } from '@/stores/goals'
import { useToastStore } from '@/stores/toast'
import { getCurrencySymbol } from '@/utils/currency'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'

const ICONS = ['✈️', '🏠', '🚗', '☂️', '🐷', '🎁', '🎓', '❤️']

const props = defineProps<{
  open: boolean
  goal: Goal | null
  currency?: string
}>()

const emit = defineEmits<{
  close: []
  saved: []
  deleted: []
}>()

const goalsStore = useGoalsStore()
const toastStore = useToastStore()
const currencySymbol = computed(() => getCurrencySymbol(props.currency ?? 'USD'))

// ── Form state ────────────────────────────────────────────────
const nameInput = ref<string>('')
const targetAmountInput = ref<string>('')
const currentAmountInput = ref<string>('')
const targetMonthInput = ref<string>('')
const selectedIcon = ref<string | null>(null)

const isUpdating = ref(false)
const isDeleting = ref(false)
const updateError = ref<string | null>(null)
const nameError = ref<string | null>(null)
const targetAmountError = ref<string | null>(null)
const currentAmountError = ref<string | null>(null)
const showDeleteConfirm = ref(false)

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

// ── Convert stored target date to YYYY-MM ─────────────────────
function dateToMonth(dateStr: string | null): string {
  if (!dateStr) return ''
  // dateStr is YYYY-MM-DD; return YYYY-MM
  return dateStr.substring(0, 7)
}

// ── Pre-fill on open ──────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.goal) {
      const g = props.goal
      nameInput.value = g.name
      targetAmountInput.value = g.targetAmount.toFixed(2)
      currentAmountInput.value = g.currentAmount.toFixed(2)
      targetMonthInput.value = dateToMonth(g.targetDate)
      selectedIcon.value = g.icon
      isUpdating.value = false
      isDeleting.value = false
      updateError.value = null
      nameError.value = null
      targetAmountError.value = null
      currentAmountError.value = null
      showDeleteConfirm.value = false
    }
  },
  { immediate: true },
)

// ── Quick increment buttons ────────────────────────────────────
function incrementCurrent(amount: number) {
  const current = parsedCurrentAmount.value
  currentAmountInput.value = (current + amount).toFixed(2)
}

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

// ── Compute target date ────────────────────────────────────────
function getTargetDateInput(): { targetDate?: string | null; clearTargetDate?: boolean } {
  if (!targetMonthInput.value) {
    // Was cleared — if there was a date before, clear it
    if (props.goal?.targetDate) return { clearTargetDate: true }
    return {}
  }
  const newDate = `${targetMonthInput.value}-01`
  return { targetDate: newDate }
}

// ── Icon input ────────────────────────────────────────────────
function getIconInput(): { icon?: string | null; clearIcon?: boolean } {
  if (selectedIcon.value === null) {
    if (props.goal?.icon) return { clearIcon: true }
    return {}
  }
  return { icon: selectedIcon.value }
}

// ── Save ──────────────────────────────────────────────────────
async function handleSave() {
  const validName = validateName()
  const validTarget = validateTargetAmount()
  const validCurrent = validateCurrentAmount()
  if (!validName || !validTarget || !validCurrent) return
  if (!props.goal) return

  isUpdating.value = true
  updateError.value = null
  try {
    await goalsStore.updateGoal(props.goal.id, {
      name: nameInput.value.trim(),
      targetAmount: parsedTargetAmount.value,
      currentAmount: parsedCurrentAmount.value,
      ...getTargetDateInput(),
      ...getIconInput(),
    })
    toastStore.show('Goal updated.')
    emit('saved')
    emit('close')
  } catch (e: unknown) {
    updateError.value = (e as Error).message ?? 'Failed to update goal.'
  } finally {
    isUpdating.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────
async function handleDelete() {
  if (!props.goal) return
  isDeleting.value = true
  try {
    await goalsStore.deleteGoal(props.goal.id)
    toastStore.show('Goal deleted.')
    emit('deleted')
    emit('close')
  } catch (e: unknown) {
    updateError.value = (e as Error).message ?? 'Failed to delete goal.'
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}
</script>

<template>
  <ResponsiveSheet :open="open" title="Edit Goal" test-id="edit-goal-sheet" @close="$emit('close')">
    <div class="px-5 pb-8 pt-4">
      <!-- Quick increment buttons for current amount -->
      <div class="mb-4">
        <p class="text-caption mb-2 font-medium text-text-secondary">Quick Add</p>
        <div class="flex gap-2">
          <button
            v-for="amount in [50, 100, 500]"
            :key="amount"
            type="button"
            class="flex-1 rounded-xl border border-primary/30 bg-primary/5 py-2 text-body font-medium text-primary transition-colors hover:bg-primary/10"
            :data-testid="`quick-add-${amount}`"
            @click="incrementCurrent(amount)"
          >
            +${{ amount }}
          </button>
        </div>
      </div>

      <!-- Icon selector -->
      <div class="mb-4">
        <p class="text-caption mb-2 font-medium text-text-secondary">Icon</p>
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
        <label for="edit-goal-name" class="text-caption mb-1 block font-medium text-text-secondary">
          Goal Name
        </label>
        <input
          id="edit-goal-name"
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
        <label for="edit-goal-target" class="text-caption mb-1 block font-medium text-text-secondary">
          Target Amount
        </label>
        <div
          class="flex h-12 items-center rounded-xl border bg-surface transition-colors"
          :class="targetAmountError ? 'border-danger ring-2 ring-danger' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary'"
        >
          <span class="pl-4 pr-1 text-body text-text-muted">{{ currencySymbol }}</span>
          <input
            id="edit-goal-target"
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

      <!-- Current amount -->
      <div class="mb-4">
        <label for="edit-goal-current" class="text-caption mb-1 block font-medium text-text-secondary">
          Amount Saved
        </label>
        <div
          class="flex h-12 items-center rounded-xl border bg-surface transition-colors"
          :class="currentAmountError ? 'border-danger ring-2 ring-danger' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary'"
        >
          <span class="pl-4 pr-1 text-body text-text-muted">{{ currencySymbol }}</span>
          <input
            id="edit-goal-current"
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

      <!-- Target date -->
      <div class="mb-4">
        <label for="edit-goal-date" class="text-caption mb-1 block font-medium text-text-secondary">
          Target Date <span class="text-text-muted">(optional)</span>
        </label>
        <input
          id="edit-goal-date"
          v-model="targetMonthInput"
          type="month"
          class="h-12 w-full rounded-xl border border-border bg-surface px-4 text-body text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary"
          data-testid="target-date-input"
        />
      </div>

      <!-- Error -->
      <p v-if="updateError" class="text-caption mb-3 text-danger" role="alert" data-testid="update-error">
        {{ updateError }}
      </p>

      <!-- Save button -->
      <button
        type="button"
        class="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-medium text-white transition-opacity disabled:opacity-50"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        :disabled="!isFormValid || isUpdating || isDeleting"
        data-testid="save-goal-btn"
        @click="handleSave"
      >
        <Loader2 v-if="isUpdating" :size="18" class="animate-spin" />
        {{ isUpdating ? 'Saving...' : 'Save Changes' }}
      </button>

      <!-- Delete button -->
      <template v-if="!showDeleteConfirm">
        <button
          type="button"
          class="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/5 font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
          :disabled="isUpdating || isDeleting"
          data-testid="delete-goal-btn"
          @click="showDeleteConfirm = true"
        >
          <Trash2 :size="16" />
          Delete Goal
        </button>
      </template>

      <!-- Delete confirmation -->
      <template v-else>
        <div class="rounded-xl border border-danger/30 bg-danger/5 p-4" data-testid="delete-confirm">
          <p class="mb-3 text-body font-medium text-text-primary">Delete this goal?</p>
          <p class="text-caption mb-4 text-text-secondary">This action cannot be undone.</p>
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-xl border border-border bg-surface py-2 text-body font-medium text-text-primary transition-colors hover:bg-surface-muted"
              data-testid="cancel-delete-btn"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2 text-body font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              :disabled="isDeleting"
              data-testid="confirm-delete-btn"
              @click="handleDelete"
            >
              <Loader2 v-if="isDeleting" :size="16" class="animate-spin" />
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </ResponsiveSheet>
</template>
