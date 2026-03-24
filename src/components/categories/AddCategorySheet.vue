<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const categoriesStore = useCategoriesStore()

// ── Form state ────────────────────────────────────────────────
const name = ref('')
const selectedIcon = ref<string | null>(null)
const selectedColor = ref<string>('#4CAF50')
const selectedParentId = ref<string | null>(null)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const nameError = ref<string | null>(null)
const nameWarning = ref<string | null>(null)

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

// ── Top-level categories for parent dropdown ──────────────────
const parentOptions = computed(() =>
  categoriesStore.topLevelCategories,
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
  // Duplicate check (warning, not blocking)
  const duplicate = categoriesStore.categories.some(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  )
  nameWarning.value = duplicate ? 'A category with this name already exists.' : null
  return true
}

const isFormValid = computed(() => name.value.trim().length > 0)

// ── Reset on open ─────────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = ''
      selectedIcon.value = null
      selectedColor.value = '#4CAF50'
      selectedParentId.value = null
      nameError.value = null
      nameWarning.value = null
      submitError.value = null
    }
  },
)

// ── Submit ────────────────────────────────────────────────────
async function handleSubmit() {
  const nameValid = validateName()
  if (!nameValid) return

  isSubmitting.value = true
  submitError.value = null
  try {
    await categoriesStore.createCategory({
      name: name.value.trim(),
      icon: selectedIcon.value,
      color: selectedColor.value,
      parentId: selectedParentId.value,
    })
    emit('created')
    emit('close')
  } catch (e: unknown) {
    submitError.value = (e as Error).message ?? 'Failed to create category.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <ResponsiveSheet :open="open" title="New Category" test-id="add-category-sheet" @close="$emit('close')">
    <div class="px-5 pb-8 pt-4">
      <!-- Name -->
      <div class="mb-4">
        <label
          for="add-category-name"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Name
        </label>
        <input
          id="add-category-name"
          v-model="name"
          type="text"
          class="h-12 w-full rounded-xl bg-surface-muted px-4 text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
          placeholder='e.g., "Coffee"'
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

      <!-- Parent category (optional) -->
      <div class="mb-6">
        <label
          for="add-category-parent"
          class="text-caption mb-1 block font-medium text-text-secondary"
        >
          Parent Category (optional)
        </label>
        <div class="relative">
          <select
            id="add-category-parent"
            v-model="selectedParentId"
            class="h-12 w-full appearance-none rounded-xl bg-surface-muted px-4 pr-10 text-text-primary outline-none transition-colors focus:ring-2 focus:ring-primary"
          >
            <option :value="null">None</option>
            <option
              v-for="parent in parentOptions"
              :key="parent.id"
              :value="parent.id"
            >
              {{ parent.icon ?? '' }} {{ parent.name }}
            </option>
          </select>
          <span
            class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      <!-- Error message -->
      <p v-if="submitError" class="text-caption mb-3 text-danger" role="alert">
        {{ submitError }}
      </p>

      <!-- Submit button -->
      <button
        type="button"
        class="h-12 w-full rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        :disabled="!isFormValid || isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? 'Saving…' : 'Save Category' }}
      </button>
    </div>
  </ResponsiveSheet>
</template>
