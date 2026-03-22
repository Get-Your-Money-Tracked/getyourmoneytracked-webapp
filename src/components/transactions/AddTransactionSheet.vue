<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useTransactionsStore } from '@/stores/transactions'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import { parseTags, validateTags } from '@/utils/tags'
import { useToastStore } from '@/stores/toast'
import NumPad from '@/components/common/NumPad.vue'
import AmountDisplay from '@/components/common/AmountDisplay.vue'
import TransactionTypeToggle from '@/components/common/TransactionTypeToggle.vue'
import AccountSelector from '@/components/common/AccountSelector.vue'
import DateSelector from '@/components/common/DateSelector.vue'
import CategoryPicker from '@/components/common/CategoryPicker.vue'
import type { TransactionType } from '@/types'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const transactionsStore = useTransactionsStore()
const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

// ── Form state ────────────────────────────────────────────────
const transactionType = ref<TransactionType>('EXPENSE')
const amountString = ref('0')
const categoryId = ref<string | null>(null)
const accountId = ref<string | null>(null)
const toAccountId = ref<string | null>(null)
const selectedDate = ref(todayIso())
const description = ref('')
const notes = ref('')
const tagsInput = ref('')
const showMoreDetails = ref(false)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const showDiscardDialog = ref(false)
const tagsError = ref<string | null>(null)

// ── Helpers ───────────────────────────────────────────────────
function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Computed ──────────────────────────────────────────────────
const activeAccounts = computed(() => accountsStore.activeAccounts)

const currency = computed(() => authStore.defaultCurrency || 'USD')

const isDirty = computed(
  () => amountString.value !== '0' || categoryId.value !== null,
)

const isSaveDisabled = computed(() => {
  if (amountString.value === '0' || parseFloat(amountString.value) === 0) return true
  if (transactionType.value !== 'TRANSFER' && !categoryId.value) return true
  if (!accountId.value) return true
  if (transactionType.value === 'TRANSFER' && !toAccountId.value) return true
  return isSubmitting.value
})

const saveButtonColor = computed(() => {
  switch (transactionType.value) {
    case 'EXPENSE':
      return 'var(--color-danger)'
    case 'INCOME':
      return 'var(--color-primary)'
    case 'TRANSFER':
      return 'var(--color-info)'
  }
})

// ── Numpad logic ──────────────────────────────────────────────
function handleDigit(d: string) {
  if (amountString.value === '0') {
    amountString.value = d
    return
  }
  const dotIdx = amountString.value.indexOf('.')
  if (dotIdx !== -1 && amountString.value.length - dotIdx > 2) return
  const next = amountString.value + d
  if (parseFloat(next) > 999_999_999.99) return
  amountString.value = next
}

function handleDecimal() {
  if (amountString.value.includes('.')) return
  amountString.value += '.'
}

function handleBackspace() {
  if (amountString.value.length <= 1) {
    amountString.value = '0'
    return
  }
  amountString.value = amountString.value.slice(0, -1)
}

// ── Type change ───────────────────────────────────────────────
watch(transactionType, (newType) => {
  if (newType === 'TRANSFER') {
    categoryId.value = null
  }
})

// ── Reset on open ─────────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      transactionType.value = 'EXPENSE'
      amountString.value = '0'
      // Session memory: restore last-used account/category
      categoryId.value = transactionsStore.lastUsedCategoryId
      const defaultAcc = accountsStore.defaultAccount
      accountId.value =
        transactionsStore.lastUsedAccountId ??
        (defaultAcc ? defaultAcc.id : activeAccounts.value[0]?.id ?? null)
      toAccountId.value = null
      selectedDate.value = todayIso()
      description.value = ''
      notes.value = ''
      tagsInput.value = ''
      showMoreDetails.value = false
      submitError.value = null
      tagsError.value = null
      showDiscardDialog.value = false
      // Load data if not already loaded
      if (accountsStore.accounts.length === 0) accountsStore.loadAccounts()
      if (categoriesStore.categories.length === 0) categoriesStore.loadCategories()
    }
  },
)

// ── Swipe-to-dismiss ──────────────────────────────────────────
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const delta = e.changedTouches[0].clientY - touchStartY
  if (delta > 80) {
    handleDismiss()
  }
}

function handleDismiss() {
  if (isDirty.value) {
    showDiscardDialog.value = true
  } else {
    emit('close')
  }
}

function confirmDiscard() {
  showDiscardDialog.value = false
  emit('close')
}

function cancelDiscard() {
  showDiscardDialog.value = false
}

// ── Submit ────────────────────────────────────────────────────
async function handleSubmit() {
  if (isSaveDisabled.value) return

  // Validate tags
  const parsedTags = parseTags(tagsInput.value)
  const tagValidationError = validateTags(parsedTags)
  if (tagValidationError) {
    tagsError.value = tagValidationError
    return
  }
  tagsError.value = null

  isSubmitting.value = true
  submitError.value = null

  try {
    await transactionsStore.createTransaction({
      type: transactionType.value,
      amount: parseFloat(amountString.value),
      date: selectedDate.value,
      accountId: accountId.value!,
      toAccountId: transactionType.value === 'TRANSFER' ? toAccountId.value : null,
      categoryId: transactionType.value !== 'TRANSFER' ? categoryId.value : null,
      description: description.value.trim() || null,
      notes: notes.value.trim() || null,
      tags: parsedTags,
    })
    const typeLabel =
      transactionType.value === 'EXPENSE'
        ? 'Expense'
        : transactionType.value === 'INCOME'
          ? 'Income'
          : 'Transfer'
    toastStore.show(`${typeLabel} saved`, 'success')
    emit('created')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to save transaction.'
  } finally {
    isSubmitting.value = false
  }
}

const saveLabel = computed(() => {
  const typeLabel =
    transactionType.value === 'EXPENSE'
      ? 'Expense'
      : transactionType.value === 'INCOME'
        ? 'Income'
        : 'Transfer'
  return `Save ${typeLabel}`
})
</script>

<template>
  <!-- Backdrop -->
  <Transition name="backdrop">
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/40"
      aria-hidden="true"
      @click="handleDismiss"
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
      aria-label="Add Transaction"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- Drag handle -->
      <div class="flex justify-center pb-2 pt-3">
        <div class="h-1 w-8 rounded-full bg-border" aria-hidden="true" />
      </div>

      <div class="px-5 pb-4 pt-1">
        <!-- Transaction Type Toggle -->
        <div class="mb-3">
          <TransactionTypeToggle v-model="transactionType" />
        </div>

        <!-- Amount Display -->
        <AmountDisplay
          :amount="amountString"
          :currency="currency"
          :transaction-type="transactionType"
        />

        <!-- Category Picker (hidden for Transfer) -->
        <div v-if="transactionType !== 'TRANSFER'" class="mb-3">
          <CategoryPicker v-model="categoryId" :transaction-type="transactionType" />
        </div>

        <!-- Account + Date row -->
        <div class="mb-3 flex gap-2">
          <template v-if="transactionType === 'TRANSFER'">
            <!-- From account -->
            <div class="flex-1">
              <AccountSelector
                :model-value="accountId"
                :accounts="activeAccounts"
                label="From"
                @update:model-value="accountId = $event"
              />
            </div>
            <!-- Arrow -->
            <div class="flex items-end pb-1 text-text-muted">→</div>
            <!-- To account -->
            <div class="flex-1">
              <AccountSelector
                :model-value="toAccountId"
                :accounts="activeAccounts"
                label="To"
                @update:model-value="toAccountId = $event"
              />
            </div>
          </template>
          <template v-else>
            <AccountSelector
              :model-value="accountId"
              :accounts="activeAccounts"
              @update:model-value="accountId = $event"
            />
          </template>

          <DateSelector v-model="selectedDate" />
        </div>

        <!-- More details toggle -->
        <button
          type="button"
          class="text-caption mb-2 flex items-center gap-1 text-text-secondary"
          @click="showMoreDetails = !showMoreDetails"
        >
          <span>{{ showMoreDetails ? '▾' : '▸' }}</span>
          <span>More details</span>
        </button>

        <!-- More details section -->
        <Transition name="expand">
          <div v-if="showMoreDetails" class="mb-3 space-y-2">
            <!-- Description -->
            <input
              v-model="description"
              type="text"
              placeholder="Description"
              maxlength="255"
              class="h-10 w-full rounded-xl border border-border bg-surface-muted px-3 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <!-- Notes -->
            <textarea
              v-model="notes"
              placeholder="Notes"
              maxlength="1000"
              rows="2"
              class="w-full resize-none rounded-xl border border-border bg-surface-muted px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <!-- Tags -->
            <div>
              <input
                v-model="tagsInput"
                type="text"
                placeholder="Tags (e.g. vacation, food)"
                class="h-10 w-full rounded-xl border border-border bg-surface-muted px-3 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                :class="{ 'border-danger ring-2 ring-danger/20': tagsError }"
              />
              <p v-if="tagsError" class="text-caption mt-1 text-danger">{{ tagsError }}</p>
            </div>
          </div>
        </Transition>

        <!-- NumPad -->
        <div class="mb-3">
          <NumPad
            @digit="handleDigit"
            @decimal="handleDecimal"
            @backspace="handleBackspace"
          />
        </div>

        <!-- Error message -->
        <div
          v-if="submitError"
          class="text-body mb-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger"
          role="alert"
        >
          {{ submitError }}
        </div>

        <!-- Save button -->
        <button
          type="button"
          class="flex h-12 w-full items-center justify-center rounded-xl font-semibold text-white transition-opacity duration-150"
          :style="{ backgroundColor: saveButtonColor }"
          :disabled="isSaveDisabled"
          :class="{ 'cursor-not-allowed opacity-50': isSaveDisabled }"
          @click="handleSubmit"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
            <Loader2 :size="18" class="animate-spin" />
            Saving…
          </span>
          <span v-else>{{ saveLabel }}</span>
        </button>
      </div>
    </div>
  </Transition>

  <!-- Discard confirmation dialog -->
  <Transition name="backdrop">
    <div
      v-if="showDiscardDialog"
      class="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
    >
      <div
        class="w-full max-w-sm rounded-2xl bg-surface p-6"
        :style="{ boxShadow: 'var(--shadow-dropdown)' }"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="discard-title"
      >
        <h3 id="discard-title" class="text-card-title mb-2 font-semibold text-text-primary">
          Discard this entry?
        </h3>
        <p class="text-body mb-5 text-text-secondary">
          Your changes will be lost.
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-xl px-4 py-2.5 text-body font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            @click="cancelDiscard"
          >
            Keep editing
          </button>
          <button
            type="button"
            class="flex-1 rounded-xl bg-danger px-4 py-2.5 text-body font-medium text-white transition-opacity hover:opacity-90"
            @click="confirmDiscard"
          >
            Discard
          </button>
        </div>
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

.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.2s ease, max-height 0.2s ease;
  max-height: 300px;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.z-60 {
  z-index: 60;
}
</style>
