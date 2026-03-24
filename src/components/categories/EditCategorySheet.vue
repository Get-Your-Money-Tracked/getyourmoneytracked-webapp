<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useTransactionsStore } from '@/stores/transactions'
import { useToastStore } from '@/stores/toast'
import type { Category } from '@/types'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'

const props = defineProps<{
  open: boolean
  category: Category | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
  deleted: []
}>()

const categoriesStore = useCategoriesStore()
const transactionsStore = useTransactionsStore()
const toastStore = useToastStore()

// ── Form state ────────────────────────────────────────────────
const name = ref('')
const selectedIcon = ref<string | null>(null)
const selectedColor = ref<string>('#4CAF50')
const isSubmitting = ref(false)
const isDeleting = ref(false)
const submitError = ref<string | null>(null)
const nameError = ref<string | null>(null)
const nameWarning = ref<string | null>(null)
const showDeleteConfirm = ref(false)

// ── Icon options ──────────────────────────────────────────────
const ICON_OPTIONS = [
  '🏠', '🍽️', '🚗', '⚡', '🎬', '❤️', '🛍️', '🎁',
  '📚', '☕', '✈️', '🏋️', '🎵', '🐾', '💊', '🔧',
  '🎓', '💼', '🏪', '🎮',
]

// ── Preset colors ─────────────────────────────────────────────
const PRESET_COLORS = [
  '#4CAF50', '#FF9800', '#2196F3', '#9C27B0',
  '#E91E63', '#F44336', '#00BCD4', '#FF5722',
  '#3F51B5', '#607D8B', '#795548', '#CDDC39',
]

// ── Derived: category has transactions? ───────────────────────
const hasTransactions = computed(() => {
  if (!props.category) return false
  return transactionsStore.transactions.some((t) => t.categoryId === props.category!.id)
})

// ── Pre-fill when opening ─────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.category) {
      name.value = props.category.name
      selectedIcon.value = props.category.icon
      selectedColor.value = props.category.color ?? '#4CAF50'
      nameError.value = null
      nameWarning.value = null
      submitError.value = null
      showDeleteConfirm.value = false
    }
  },
  { immediate: true },
)

// ── Validation ────────────────────────────────────────────────
function validateName(): boolean {
  const trimmed = name.value.trim()
  if (!trimmed) {
    nameError.value = 'Category name is required.'
    nameWarning.value = null
    return false
  }
  if (trimmed.length > 100) {
    nameError.value = 'Name must be 100 characters or less.'
    nameWarning.value = null
    return false
  }
  nameError.value = null
  // Duplicate check (warning, not blocking) — exclude current category
  const duplicate = categoriesStore.categories.some(
    (c) => c.id !== props.category?.id && c.name.toLowerCase() === trimmed.toLowerCase(),
  )
  nameWarning.value = duplicate ? 'A category with this name already exists.' : null
  return true
}

// ── Save ──────────────────────────────────────────────────────
async function handleSave() {
  const nameValid = validateName()
  if (!nameValid || !props.category) return

  isSubmitting.value = true
  submitError.value = null
  try {
    await categoriesStore.updateCategory(props.category.id, {
      name: name.value.trim(),
      icon: selectedIcon.value,
      color: selectedColor.value,
    })
    emit('saved')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to save category.'
  } finally {
    isSubmitting.value = false
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
  if (!props.category) return
  isDeleting.value = true
  // Snapshot for undo before deleting
  const snapshot = { ...props.category }
  try {
    await categoriesStore.deleteCategory(props.category.id)
    showDeleteConfirm.value = false
    emit('deleted')
    emit('close')
    toastStore.show(
      'Category deleted',
      'success',
      5000,
      {
        label: 'Undo',
        callback: () => {
          categoriesStore.createCategory({
            name: snapshot.name,
            icon: snapshot.icon,
            color: snapshot.color,
            parentId: snapshot.parentId,
          }).catch(() => {/* undo failed silently */})
        },
      },
    )
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to delete category.'
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
        :aria-label="`Delete ${category?.name}?`"
      >
        <h3 class="text-section-title mb-2 font-semibold text-text-primary">
          Delete {{ category?.name }}?
        </h3>
        <p class="text-body mb-6 text-text-secondary">
          This category will be permanently removed. This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="text-body h-11 flex-1 rounded-xl border border-border font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button
            type="button"
            class="text-body h-11 flex-1 rounded-xl font-medium text-white transition-opacity"
            :style="{ backgroundColor: 'var(--color-danger)' }"
            :disabled="isDeleting"
            @click="confirmDelete"
          >
            {{ isDeleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <ResponsiveSheet
    :open="open"
    :title="category ? `Edit ${category.name}` : 'Edit Category'"
    test-id="edit-category-sheet"
    @close="$emit('close')"
  >
    <div class="px-5 pb-8 pt-4">
      <!-- Name -->
      <div class="mb-4">
        <label
          for="edit-category-name"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Name
        </label>
        <input
          id="edit-category-name"
          v-model="name"
          type="text"
          class="h-12 w-full rounded-xl bg-surface-muted px-4 text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
          placeholder="Category name"
          autocomplete="off"
          @blur="validateName"
        />
        <p v-if="nameError" class="text-caption mt-1 text-danger" role="alert">
          {{ nameError }}
        </p>
        <p v-else-if="nameWarning" class="text-caption mt-1 text-warning">
          {{ nameWarning }}
        </p>
      </div>

      <!-- Icon picker -->
      <div class="mb-4">
        <label class="text-caption mb-2 block font-medium text-text-secondary">
          Icon
        </label>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="icon in ICON_OPTIONS"
            :key="icon"
            type="button"
            class="flex h-11 w-full items-center justify-center rounded-xl text-xl transition-colors duration-150"
            :class="
              selectedIcon === icon
                ? 'ring-2 ring-primary bg-primary/10'
                : 'bg-surface-muted hover:bg-surface-elevated'
            "
            :aria-pressed="selectedIcon === icon"
            :aria-label="`Select icon ${icon}`"
            @click="selectedIcon = selectedIcon === icon ? null : icon"
          >
            {{ icon }}
          </button>
        </div>
      </div>

      <!-- Color picker -->
      <div class="mb-4">
        <label class="text-caption mb-2 block font-medium text-text-secondary">
          Color
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="color in PRESET_COLORS"
            :key="color"
            type="button"
            class="h-8 w-8 flex-shrink-0 rounded-full transition-all duration-150"
            :style="{ backgroundColor: color }"
            :class="
              selectedColor === color
                ? 'ring-2 ring-offset-2 ring-primary scale-110'
                : 'opacity-80 hover:opacity-100'
            "
            :aria-pressed="selectedColor === color"
            :aria-label="`Select color ${color}`"
            @click="selectedColor = color"
          />
        </div>
      </div>

      <!-- Read-only parent indicator (if sub-category) -->
      <div v-if="category?.parentId" class="mb-4">
        <p class="text-caption text-text-muted">
          Sub-category (parent cannot be changed)
        </p>
      </div>

      <!-- Error message -->
      <p v-if="submitError" class="text-caption mb-3 text-danger" role="alert">
        {{ submitError }}
      </p>

      <!-- Save button -->
      <button
        type="button"
        class="mb-4 h-12 w-full rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        :disabled="isSubmitting"
        @click="handleSave"
      >
        {{ isSubmitting ? 'Saving…' : 'Save' }}
      </button>

      <!-- Delete button — only for non-default categories -->
      <template v-if="category && !category.isDefault">
        <div class="border-t border-border pt-4">
          <button
            type="button"
            class="text-body h-11 w-full rounded-xl border font-medium transition-colors"
            :style="{
              borderColor: 'var(--color-danger)',
              color: 'var(--color-danger)',
            }"
            :class="{ 'opacity-50 cursor-not-allowed': hasTransactions }"
            :disabled="hasTransactions"
            @click="requestDelete"
          >
            Delete Category
          </button>
          <p v-if="hasTransactions" class="text-caption mt-2 text-center text-text-muted">
            Cannot delete a category that has transactions. Reassign or remove them first.
          </p>
        </div>
      </template>
    </div>
  </ResponsiveSheet>
</template>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
</style>
