<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useTransactionsStore } from '@/stores/transactions'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { callUsedTags } from '@/graphql/queries/tags'
import { validateTags } from '@/utils/tags'
import NumPad from '@/components/common/NumPad.vue'
import AmountDisplay from '@/components/common/AmountDisplay.vue'
import TransactionTypeToggle from '@/components/common/TransactionTypeToggle.vue'
import AccountSelector from '@/components/common/AccountSelector.vue'
import DateSelector from '@/components/common/DateSelector.vue'
import CategoryPicker from '@/components/common/CategoryPicker.vue'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'
import TagInput from '@/components/common/TagInput.vue'
import type { Transaction, TransactionType } from '@/types'
import { suggestCategory, learnCategoryMapping } from '@/composables/useCategorySuggestion'

const props = defineProps<{
  open: boolean
  /** Pre-set transaction type when the sheet opens */
  defaultType?: TransactionType
  /** Pre-fill from an existing transaction (repeat) */
  prefill?: Transaction | null
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
const tags = ref<string[]>([])
const availableTags = ref<string[]>([])
const showMoreDetails = ref(false)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const showDiscardDialog = ref(false)

// ── Helpers ───────────────────────────────────────────────────
function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Computed ──────────────────────────────────────────────────
const activeAccounts = computed(() => accountsStore.accounts)

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
    default:
      return 'var(--color-primary)'
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

// ── Smart category suggestion ─────────────────────────────────
const categoryManuallySet = ref(false)
const suggestedCategoryId = ref<string | null>(null)

watch(description, (desc) => {
  if (categoryManuallySet.value || transactionType.value === 'TRANSFER') return
  const suggestion = suggestCategory(desc)
  if (suggestion) {
    suggestedCategoryId.value = suggestion
    categoryId.value = suggestion
  }
})

watch(categoryId, (newVal, oldVal) => {
  // If user manually changed category (not from suggestion), mark as manual
  if (newVal !== suggestedCategoryId.value && oldVal === suggestedCategoryId.value) {
    categoryManuallySet.value = true
  }
})

// ── Reset on open ─────────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // If prefilling from existing transaction (repeat)
      const pf = props.prefill
      transactionType.value = pf?.type ?? props.defaultType ?? 'EXPENSE'
      amountString.value = pf ? pf.amount.toString() : '0'
      categoryId.value = pf?.categoryId ?? transactionsStore.lastUsedCategoryId
      const defaultAcc = accountsStore.defaultAccount
      accountId.value =
        pf?.accountId ??
        transactionsStore.lastUsedAccountId ??
        (defaultAcc ? defaultAcc.id : activeAccounts.value[0]?.id ?? null)
      toAccountId.value = pf?.toAccountId ?? null
      selectedDate.value = todayIso() // Always today for repeat
      description.value = pf?.description ?? ''
      notes.value = pf?.notes ?? ''
      tags.value = pf?.tags ? [...pf.tags] : []
      showMoreDetails.value = false
      submitError.value = null
      showDiscardDialog.value = false
      categoryManuallySet.value = false
      suggestedCategoryId.value = null
      // Load data if not already loaded (or if previous load failed)
      if (accountsStore.accounts.length === 0 || accountsStore.error) accountsStore.loadAccounts()
      if (categoriesStore.categories.length === 0 || categoriesStore.error) categoriesStore.loadCategories()
      // Load available tags for autocomplete
      callUsedTags().then((t) => { availableTags.value = t }).catch((e) => console.error('Failed to load tags:', e))
    }
  },
)

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

  if (!accountId.value) {
    submitError.value = 'Please select an account.'
    return
  }

  const tagError = validateTags(tags.value)
  if (tagError) {
    submitError.value = tagError
    return
  }

  isSubmitting.value = true
  submitError.value = null

  try {
    await transactionsStore.createTransaction({
      type: transactionType.value,
      amount: parseFloat(amountString.value),
      date: selectedDate.value,
      accountId: accountId.value,
      toAccountId: transactionType.value === 'TRANSFER' ? toAccountId.value : null,
      categoryId: transactionType.value !== 'TRANSFER' ? categoryId.value : null,
      description: description.value.trim() || null,
      notes: notes.value.trim() || null,
      tags: tags.value,
    })
    const typeLabel =
      transactionType.value === 'EXPENSE'
        ? 'Expense'
        : transactionType.value === 'INCOME'
          ? 'Income'
          : 'Transfer'
    toastStore.show(`${typeLabel} saved`, 'success')
    // Learn category association for future suggestions
    learnCategoryMapping(description.value, categoryId.value)
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
  <ResponsiveSheet
    :open="open"
    title="Add Transaction"
    test-id="add-transaction-sheet"
    @close="handleDismiss"
  >
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

      <!-- Description -->
      <input
        v-model="description"
        type="text"
        placeholder="Description"
        maxlength="255"
        class="mb-2 h-10 w-full rounded-xl border border-border bg-surface-muted px-3 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

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
            <p class="text-caption text-text-secondary mb-1.5">Tags</p>
            <TagInput
              v-model="tags"
              :suggestions="availableTags"
              data-testid="tag-input-component"
            />
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
  </ResponsiveSheet>

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

.z-60 {
  z-index: 60;
}
</style>
