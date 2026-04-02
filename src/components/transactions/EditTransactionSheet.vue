<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loader2, Trash2 } from 'lucide-vue-next'
import { useTransactionsStore } from '@/stores/transactions'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import { parseTags, tagsToString, validateTags } from '@/utils/tags'
import { useToastStore } from '@/stores/toast'
import NumPad from '@/components/common/NumPad.vue'
import AmountDisplay from '@/components/common/AmountDisplay.vue'
import TransactionTypeToggle from '@/components/common/TransactionTypeToggle.vue'
import AccountSelector from '@/components/common/AccountSelector.vue'
import DateSelector from '@/components/common/DateSelector.vue'
import CategoryPicker from '@/components/common/CategoryPicker.vue'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'
import type { Transaction, TransactionType } from '@/types'

const props = defineProps<{
  open: boolean
  transaction: Transaction | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
  deleted: []
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
const selectedDate = ref('')
const description = ref('')
const notes = ref('')
const tagsInput = ref('')
const showMoreDetails = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const submitError = ref<string | null>(null)
const showDeleteDialog = ref(false)
const showDiscardDialog = ref(false)
const tagsError = ref<string | null>(null)
const isAmountReset = ref(false)

// ── Original snapshot (for dirty checking) ────────────────────
const originalSnapshot = ref<{
  type: TransactionType
  amount: string
  categoryId: string | null
  accountId: string | null
  toAccountId: string | null
  date: string
  description: string
  notes: string
  tagsInput: string
} | null>(null)

// ── Helpers ───────────────────────────────────────────────────
const activeAccounts = computed(() => accountsStore.accounts)
const currency = computed(() => authStore.defaultCurrency || 'USD')

const isDirty = computed(() => {
  if (!originalSnapshot.value) return false
  const snap = originalSnapshot.value
  return (
    transactionType.value !== snap.type ||
    amountString.value !== snap.amount ||
    categoryId.value !== snap.categoryId ||
    accountId.value !== snap.accountId ||
    toAccountId.value !== snap.toAccountId ||
    selectedDate.value !== snap.date ||
    description.value !== snap.description ||
    notes.value !== snap.notes ||
    tagsInput.value !== snap.tagsInput
  )
})

const isSaveDisabled = computed(() => {
  if (amountString.value === '0' || parseFloat(amountString.value) === 0) return true
  if (transactionType.value !== 'TRANSFER' && !categoryId.value) return true
  if (!accountId.value) return true
  if (transactionType.value === 'TRANSFER' && !toAccountId.value) return true
  return isSubmitting.value || isDeleting.value
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

// ── Pre-fill from transaction prop ───────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.transaction) {
      prefillFromTransaction(props.transaction)
    }
  },
  { immediate: true },
)

watch(
  () => props.transaction,
  (tx) => {
    if (props.open && tx) {
      prefillFromTransaction(tx)
    }
  },
)

function prefillFromTransaction(tx: Transaction) {
  transactionType.value = tx.type
  amountString.value = tx.amount.toString()
  categoryId.value = tx.categoryId
  accountId.value = tx.accountId
  toAccountId.value = tx.toAccountId
  selectedDate.value = tx.date.split('T')[0]
  description.value = tx.description ?? ''
  notes.value = tx.notes ?? ''
  tagsInput.value = tagsToString(tx.tags)
  // Auto-expand if any optional field has data
  showMoreDetails.value = !!(tx.description || tx.notes || tx.tags.length > 0)
  submitError.value = null
  tagsError.value = null
  showDeleteDialog.value = false
  showDiscardDialog.value = false
  isSubmitting.value = false
  isDeleting.value = false
  isAmountReset.value = false

  // Warn if referenced account or category was deleted since this transaction was created
  const accountMissing = tx.accountId && !accountsStore.accounts.some((a) => a.id === tx.accountId)
  const categoryMissing =
    tx.categoryId && !categoriesStore.categories.some((c) => c.id === tx.categoryId)
  if (accountMissing || categoryMissing) {
    submitError.value =
      'This transaction references a deleted ' +
      [accountMissing && 'account', categoryMissing && 'category'].filter(Boolean).join(' and ') +
      '. Please update the fields before saving.'
  }

  // Snapshot original values for dirty checking
  originalSnapshot.value = {
    type: tx.type,
    amount: tx.amount.toString(),
    categoryId: tx.categoryId,
    accountId: tx.accountId,
    toAccountId: tx.toAccountId,
    date: tx.date.split('T')[0],
    description: tx.description ?? '',
    notes: tx.notes ?? '',
    tagsInput: tagsToString(tx.tags),
  }
}

// ── Numpad logic ──────────────────────────────────────────────
function handleDigit(d: string) {
  // First keypress resets the pre-filled amount
  if (!isAmountReset.value) {
    amountString.value = d
    isAmountReset.value = true
    return
  }
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
  if (!isAmountReset.value) {
    amountString.value = '0.'
    isAmountReset.value = true
    return
  }
  if (amountString.value.includes('.')) return
  amountString.value += '.'
}

function handleBackspace() {
  isAmountReset.value = true
  if (amountString.value.length <= 1) {
    amountString.value = '0'
    return
  }
  amountString.value = amountString.value.slice(0, -1)
}

// ── Dismiss with dirty check ──────────────────────────────────
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

// ── Submit (update) ───────────────────────────────────────────
async function handleSubmit() {
  if (isSaveDisabled.value || !props.transaction) return

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
    await transactionsStore.updateTransaction(props.transaction.id, {
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
    toastStore.show('Transaction updated', 'success')
    emit('saved')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to update transaction.'
  } finally {
    isSubmitting.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────
function requestDelete() {
  showDeleteDialog.value = true
}

function cancelDelete() {
  showDeleteDialog.value = false
}

async function confirmDelete() {
  if (!props.transaction || isDeleting.value) return
  isDeleting.value = true
  // Snapshot for undo before deleting
  const snapshot = { ...props.transaction }
  try {
    await transactionsStore.deleteTransaction(props.transaction.id)
    showDeleteDialog.value = false
    emit('deleted')
    emit('close')
    toastStore.show(
      'Transaction deleted',
      'success',
      5000,
      {
        label: 'Undo',
        callback: () => {
          transactionsStore.createTransaction({
            type: snapshot.type,
            amount: snapshot.amount,
            date: snapshot.date.split('T')[0],
            accountId: snapshot.accountId,
            toAccountId: snapshot.toAccountId,
            categoryId: snapshot.categoryId,
            description: snapshot.description,
            notes: snapshot.notes,
            tags: snapshot.tags,
            receiptUrl: snapshot.receiptUrl,
          }).catch(() => {/* undo failed silently */})
        },
      },
    )
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to delete transaction.'
    showDeleteDialog.value = false
    isDeleting.value = false
  }
}

const deleteDescriptionText = computed(() => {
  if (!props.transaction) return ''
  const amount = props.transaction.amount.toFixed(2)
  const typeLabel = props.transaction.type.toLowerCase()
  // Find category name for context
  const cat = props.transaction.categoryId
    ? categoriesStore.categories.find((c) => c.id === props.transaction!.categoryId)
    : null
  const catName = cat ? cat.name + ' ' : ''
  // Format date for context
  const dateStr = props.transaction.date.split('T')[0]
  const dateParts = dateStr.split('-')
  const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]))
  const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  return `You're about to delete a $${amount} ${catName}${typeLabel} from ${formattedDate}. This cannot be undone.`
})
</script>

<template>
  <ResponsiveSheet
    :open="open"
    title="Edit Transaction"
    test-id="edit-transaction-sheet"
    @close="handleDismiss"
  >
    <div class="px-5 pb-4 pt-1">
      <!-- Title row with delete button -->
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-body font-semibold text-text-primary">Edit Transaction</h2>
        <button
          type="button"
          class="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
          aria-label="Delete transaction"
          :disabled="isDeleting"
          @click="requestDelete"
        >
          <Loader2 v-if="isDeleting" :size="20" class="animate-spin" />
          <Trash2 v-else :size="20" />
        </button>
      </div>

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
          <div class="flex-1">
            <AccountSelector
              :model-value="accountId"
              :accounts="activeAccounts"
              label="From"
              @update:model-value="accountId = $event"
            />
          </div>
          <div class="flex items-end pb-1 text-text-muted">→</div>
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
          <input
            v-model="description"
            type="text"
            placeholder="Description"
            maxlength="255"
            class="h-10 w-full rounded-xl border border-border bg-surface-muted px-3 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <textarea
            v-model="notes"
            placeholder="Notes"
            maxlength="1000"
            rows="2"
            class="w-full resize-none rounded-xl border border-border bg-surface-muted px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
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

      <!-- Update button -->
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
          Updating…
        </span>
        <span v-else>Update</span>
      </button>
    </div>
  </ResponsiveSheet>

  <!-- Delete confirmation dialog -->
  <Transition name="backdrop">
    <div
      v-if="showDeleteDialog"
      class="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
    >
      <div
        class="w-full max-w-sm rounded-2xl bg-surface p-6"
        :style="{ boxShadow: 'var(--shadow-dropdown)' }"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
      >
        <h3 id="delete-title" class="text-card-title mb-2 font-semibold text-text-primary">
          Delete this {{ transaction?.type?.toLowerCase() ?? 'transaction' }}?
        </h3>
        <p class="text-body mb-5 text-text-secondary">
          {{ deleteDescriptionText }}
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-xl px-4 py-2.5 text-body font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            :disabled="isDeleting"
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 rounded-xl bg-danger px-4 py-2.5 text-body font-medium text-white transition-opacity hover:opacity-90"
            :disabled="isDeleting"
            @click="confirmDelete"
          >
            <span v-if="isDeleting" class="flex items-center justify-center gap-2">
              <Loader2 :size="16" class="animate-spin" />
              Deleting…
            </span>
            <span v-else>Delete</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Discard changes confirmation dialog -->
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
          Discard changes?
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
