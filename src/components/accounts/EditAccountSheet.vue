<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAccountsStore } from '@/stores/accounts'
import { formatCurrency } from '@/utils/currency'
import type { Account } from '@/types'

const props = defineProps<{
  open: boolean
  account: Account | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
  archived: []
}>()

const accountsStore = useAccountsStore()

// ── Form state ────────────────────────────────────────────────
const name = ref('')
const selectedIcon = ref<string | null>(null)
const isDefault = ref(false)
const nameError = ref<string | null>(null)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

// ── Archive dialog state ──────────────────────────────────────
const showArchiveDialog = ref(false)
const isArchiving = ref(false)

// ── Icon options ──────────────────────────────────────────────
const ICON_OPTIONS = ['🏦', '💵', '💳', '🏠', '📱', '✈️', '🛍️', '🎓', '💼', '🏪', '🚗', '💊']

// ── Type label helper ─────────────────────────────────────────
function typeLabel(type: string): string {
  switch (type) {
    case 'CASH':
      return 'Cash'
    case 'BANK':
      return 'Bank Account'
    case 'CREDIT_CARD':
      return 'Credit Card'
    default:
      return type
  }
}

// ── Pre-fill on open ──────────────────────────────────────────
// immediate: true ensures form is pre-filled even when component mounts with open=true
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.account) {
      name.value = props.account.name
      selectedIcon.value = props.account.icon
      isDefault.value = props.account.isDefault
      nameError.value = null
      submitError.value = null
      showArchiveDialog.value = false
    }
  },
  { immediate: true },
)

// ── Validation ────────────────────────────────────────────────
function validateName(): boolean {
  const trimmed = name.value.trim()
  if (!trimmed) {
    nameError.value = 'Account name is required.'
    return false
  }
  if (trimmed.length > 100) {
    nameError.value = 'Name must be 100 characters or less.'
    return false
  }
  nameError.value = null
  return true
}

const isFormValid = computed(() => name.value.trim().length > 0)

// ── Only 1 active account → disable archive ───────────────────
const canArchive = computed(() => accountsStore.accounts.length > 1)

// ── Swipe-to-dismiss ──────────────────────────────────────────
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  if (showArchiveDialog.value) return
  const delta = e.changedTouches[0].clientY - touchStartY
  if (delta > 80) {
    emit('close')
  }
}

// ── Save ──────────────────────────────────────────────────────
async function handleSave() {
  const nameValid = validateName()
  if (!nameValid || !props.account) return

  isSubmitting.value = true
  submitError.value = null
  try {
    await accountsStore.updateAccount(props.account.id, {
      name: name.value.trim(),
      icon: selectedIcon.value,
      isDefault: isDefault.value,
    })
    emit('saved')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to save account.'
  } finally {
    isSubmitting.value = false
  }
}

// ── Archive ───────────────────────────────────────────────────
function openArchiveDialog() {
  showArchiveDialog.value = true
}

function closeArchiveDialog() {
  showArchiveDialog.value = false
}

async function confirmArchive() {
  if (!props.account) return
  isArchiving.value = true
  try {
    await accountsStore.archiveAccount(props.account.id)
    showArchiveDialog.value = false
    emit('archived')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to archive account.'
    showArchiveDialog.value = false
  } finally {
    isArchiving.value = false
  }
}
</script>

<template>
  <!-- Backdrop -->
  <Transition name="backdrop">
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/40"
      aria-hidden="true"
      @click="!showArchiveDialog && $emit('close')"
    />
  </Transition>

  <!-- Archive confirmation dialog (above the sheet) -->
  <Transition name="dialog">
    <div
      v-if="open && showArchiveDialog"
      class="fixed inset-0 z-60 flex items-center justify-center p-6"
    >
      <div
        class="w-full max-w-sm rounded-2xl bg-surface p-6"
        :style="{ boxShadow: 'var(--shadow-sheet)' }"
        role="alertdialog"
        aria-modal="true"
        :aria-label="`Archive ${account?.name}`"
      >
        <h3 class="text-section-title mb-2 font-semibold text-text-primary">
          Archive {{ account?.name }}?
        </h3>
        <p class="text-body mb-6 text-text-secondary">
          It will be hidden from account lists and transaction forms, but historical data is
          preserved.
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="text-body flex-1 rounded-xl border border-border px-4 py-2.5 font-medium text-text-secondary hover:bg-surface-muted"
            @click="closeArchiveDialog"
          >
            Cancel
          </button>
          <button
            type="button"
            class="text-body flex-1 rounded-xl px-4 py-2.5 font-semibold text-white transition-opacity"
            :style="{ backgroundColor: 'var(--color-danger)' }"
            :disabled="isArchiving"
            :class="{ 'opacity-60': isArchiving }"
            @click="confirmArchive"
          >
            <span v-if="isArchiving" class="flex items-center justify-center gap-2">
              <span
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              Archiving…
            </span>
            <span v-else>Archive</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Edit Sheet -->
  <Transition name="sheet">
    <div
      v-if="open"
      class="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface pb-safe"
      :style="{ boxShadow: 'var(--shadow-sheet)' }"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Account"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- Drag handle -->
      <div class="flex justify-center pb-2 pt-3">
        <div class="h-1 w-8 rounded-full bg-border" aria-hidden="true" />
      </div>

      <div class="px-5 pb-8 pt-2">
        <h2 class="text-section-title mb-5 font-semibold text-text-primary">Edit Account</h2>

        <!-- Name field (editable) -->
        <div class="mb-4">
          <label
            for="edit-account-name"
            class="text-caption mb-1 block font-medium text-text-secondary"
          >
            Name
          </label>
          <input
            id="edit-account-name"
            v-model="name"
            type="text"
            maxlength="100"
            class="h-12 w-full rounded-xl border border-border bg-surface-muted px-4 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            :class="{ 'border-danger ring-2 ring-danger/20': nameError }"
            autocomplete="off"
            @blur="validateName"
          />
          <p v-if="nameError" class="text-caption mt-1 text-danger">{{ nameError }}</p>
        </div>

        <!-- Read-only fields -->
        <div v-if="account" class="mb-4 space-y-3">
          <!-- Type (read-only) -->
          <div>
            <p class="text-caption mb-1 font-medium text-text-secondary">Account Type</p>
            <div
              class="flex h-12 items-center gap-2 rounded-xl border border-border bg-surface-muted px-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span class="text-body text-text-muted">{{ typeLabel(account.type) }}</span>
            </div>
          </div>

          <!-- Currency (read-only) -->
          <div>
            <p class="text-caption mb-1 font-medium text-text-secondary">Currency</p>
            <div
              class="flex h-12 items-center gap-2 rounded-xl border border-border bg-surface-muted px-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span class="text-body text-text-muted">{{ account.currency }}</span>
            </div>
          </div>

          <!-- Balance (read-only) -->
          <div>
            <p class="text-caption mb-1 font-medium text-text-secondary">Current Balance</p>
            <div
              class="flex h-12 items-center gap-2 rounded-xl border border-border bg-surface-muted px-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span class="text-body text-text-muted">
                {{ formatCurrency(account.balance, account.currency) }}
              </span>
            </div>
            <p class="text-caption mt-1 text-text-muted">
              Balance can only be changed through transactions.
            </p>
          </div>
        </div>

        <!-- Icon picker -->
        <div class="mb-4">
          <p class="text-caption mb-1.5 font-medium text-text-secondary">Icon (optional)</p>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="icon in ICON_OPTIONS"
              :key="icon"
              type="button"
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl transition-all duration-150"
              :class="
                selectedIcon === icon
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface bg-surface-muted'
                  : 'bg-surface-muted hover:bg-surface-elevated'
              "
              :aria-label="`Select icon ${icon}`"
              :aria-pressed="selectedIcon === icon"
              @click="selectedIcon = selectedIcon === icon ? null : icon"
            >
              {{ icon }}
            </button>
          </div>
        </div>

        <!-- Set as Default toggle -->
        <div class="mb-6 flex items-center justify-between">
          <div>
            <p class="text-body font-medium text-text-primary">Set as Default</p>
            <p class="text-caption text-text-secondary">
              New transactions will use this account
            </p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="isDefault"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="isDefault ? 'bg-primary' : 'bg-border'"
            @click="isDefault = !isDefault"
          >
            <span
              class="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
              :class="isDefault ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Error message -->
        <div
          v-if="submitError"
          class="text-body mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger"
          role="alert"
        >
          {{ submitError }}
        </div>

        <!-- Save button -->
        <button
          type="button"
          class="mb-4 flex h-12 w-full items-center justify-center rounded-xl font-semibold text-white transition-opacity duration-150"
          :style="{ backgroundColor: 'var(--color-primary)' }"
          :disabled="!isFormValid || isSubmitting"
          :class="{ 'cursor-not-allowed opacity-50': !isFormValid || isSubmitting }"
          @click="handleSave"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
            <span
              class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            Saving…
          </span>
          <span v-else>Save</span>
        </button>

        <!-- Archive section -->
        <div class="mt-6 border-t border-border pt-6">
          <button
            type="button"
            class="text-body flex h-12 w-full items-center justify-center rounded-xl border-2 font-medium transition-colors duration-150"
            :disabled="!canArchive"
            :class="
              canArchive
                ? 'border-danger text-danger hover:bg-danger/5'
                : 'cursor-not-allowed border-border text-text-muted'
            "
            :title="canArchive ? undefined : 'Cannot archive your only active account.'"
            :aria-describedby="!canArchive ? 'archive-disabled-hint' : undefined"
            @click="canArchive && openArchiveDialog()"
          >
            Archive Account
          </button>
          <p
            v-if="!canArchive"
            id="archive-disabled-hint"
            class="text-caption mt-1.5 text-center text-text-muted"
          >
            Cannot archive your only active account.
          </p>
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

.dialog-enter-active,
.dialog-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.z-60 {
  z-index: 60;
}
</style>
