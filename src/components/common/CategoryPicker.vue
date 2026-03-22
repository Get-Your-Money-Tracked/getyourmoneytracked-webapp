<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import CategoryChip from '@/components/common/CategoryChip.vue'
import type { Category, TransactionType } from '@/types'
import type { CategoryWithChildren } from '@/stores/categories'

const props = defineProps<{
  modelValue: string | null
  transactionType?: TransactionType
}>()

const emit = defineEmits<{
  'update:modelValue': [categoryId: string | null]
}>()

const categoriesStore = useCategoriesStore()

// ── Sub-category expansion state ──────────────────────────────
const expandedParent = ref<CategoryWithChildren | null>(null)

// ── Computed visible categories ───────────────────────────────
const visibleCategories = computed(() => {
  if (expandedParent.value) {
    return expandedParent.value.children
  }
  return categoriesStore.nestedCategories
})

// ── Hidden for transfers ──────────────────────────────────────
const isVisible = computed(() => props.transactionType !== 'TRANSFER')

// ── Handlers ──────────────────────────────────────────────────
function handleChipSelect(category: Category) {
  if (!expandedParent.value) {
    // Check if this parent has children
    const nested = categoriesStore.nestedCategories.find((c) => c.id === category.id)
    if (nested && nested.children.length > 0) {
      // Expand to show children
      expandedParent.value = nested
      return
    }
  }
  // Select the category
  emit('update:modelValue', category.id === props.modelValue ? null : category.id)
}

function handleBack() {
  expandedParent.value = null
}

// ── Check if a category has children ─────────────────────────
function hasChildren(category: Category): boolean {
  if (expandedParent.value) return false
  const nested = categoriesStore.nestedCategories.find((c) => c.id === category.id)
  return Boolean(nested && nested.children.length > 0)
}
</script>

<template>
  <div v-if="isVisible" class="w-full">
    <div
      class="flex gap-2 overflow-x-auto pb-2"
      style="scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch"
    >
      <!-- Back button when in sub-category view -->
      <button
        v-if="expandedParent"
        type="button"
        class="flex w-14 flex-shrink-0 flex-col items-center gap-1 rounded-2xl p-2 transition-colors hover:bg-surface-muted"
        aria-label="Back to categories"
        style="scroll-snap-align: center"
        @click="handleBack"
      >
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-2xl">
          ←
        </div>
        <span class="text-badge w-full truncate text-center font-medium text-text-muted">
          Back
        </span>
      </button>

      <!-- Category chips -->
      <div
        v-for="category in visibleCategories"
        :key="category.id"
        style="scroll-snap-align: center"
        class="flex-shrink-0"
      >
        <CategoryChip
          :category="category"
          :selected="modelValue === category.id"
          :has-children="hasChildren(category)"
          @select="handleChipSelect"
        />
      </div>
    </div>

    <!-- Expanded parent label -->
    <p v-if="expandedParent" class="text-caption mt-1 text-center text-text-muted">
      {{ expandedParent.name }}
    </p>
  </div>
</template>
