<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FolderOpen } from 'lucide-vue-next'
import { useCategoriesStore } from '@/stores/categories'
import CategoryListItem from '@/components/categories/CategoryListItem.vue'
import AddCategorySheet from '@/components/categories/AddCategorySheet.vue'
import EditCategorySheet from '@/components/categories/EditCategorySheet.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { Category } from '@/types'

const router = useRouter()
const categoriesStore = useCategoriesStore()

// ── Sheet state ───────────────────────────────────────────────
const showAddSheet = ref(false)
const showEditSheet = ref(false)
const selectedCategory = ref<Category | null>(null)

// ── Handlers ──────────────────────────────────────────────────
function openEditSheet(category: Category) {
  selectedCategory.value = category
  showEditSheet.value = true
}

function closeEditSheet() {
  showEditSheet.value = false
  setTimeout(() => {
    selectedCategory.value = null
  }, 300)
}

function handleMoveUp(category: Category) {
  const flat = categoriesStore.nestedCategories.flatMap((c) => [
    c,
    ...c.children,
  ]) as Category[]
  const idx = flat.findIndex((c) => c.id === category.id)
  if (idx <= 0) return
  const newOrder = flat.map((c) => c.id)
  // swap with previous
  ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
  categoriesStore.reorderCategories(newOrder)
}

function handleMoveDown(category: Category) {
  const flat = categoriesStore.nestedCategories.flatMap((c) => [
    c,
    ...c.children,
  ]) as Category[]
  const idx = flat.findIndex((c) => c.id === category.id)
  if (idx === -1 || idx >= flat.length - 1) return
  const newOrder = flat.map((c) => c.id)
  ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
  categoriesStore.reorderCategories(newOrder)
}

// ── Load on mount ─────────────────────────────────────────────
onMounted(() => {
  categoriesStore.loadCategories()
})

const SKELETON_COUNT = 6
</script>

<template>
  <div class="min-h-screen bg-surface-elevated">
    <div class="mx-auto max-w-md px-4 pb-28 pt-6">
      <!-- Header with back button -->
      <div class="mb-5 flex items-center gap-3">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-muted"
          aria-label="Back to Settings"
          @click="router.back()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-page-title font-bold text-text-primary">Manage Categories</h1>
      </div>

      <!-- Loading state -->
      <template v-if="categoriesStore.isLoading">
        <div
          class="rounded-xl bg-surface"
          :style="{ boxShadow: 'var(--shadow-card)' }"
          aria-busy="true"
          aria-label="Loading categories"
        >
          <div
            v-for="i in SKELETON_COUNT"
            :key="i"
            class="flex items-center gap-3 px-3 py-2.5"
            :class="{ 'border-t border-border': i > 1 }"
          >
            <div class="h-3 w-3 animate-pulse rounded-full bg-surface-muted" />
            <div class="h-5 w-5 animate-pulse rounded bg-surface-muted" />
            <div class="h-4 flex-1 animate-pulse rounded bg-surface-muted" />
            <div class="h-4 w-14 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <EmptyState
        v-else-if="categoriesStore.nestedCategories.length === 0"
        :icon="FolderOpen"
        title="No categories yet"
        description="Categories organize your spending into groups like Food, Transport, and Entertainment."
        action-label="Add Category"
        @action="showAddSheet = true"
      />

      <!-- Category list -->
      <template v-else>
        <div
          class="mb-4 overflow-hidden rounded-xl bg-surface"
          :style="{ boxShadow: 'var(--shadow-card)' }"
        >
          <template v-for="(parent, pIdx) in categoriesStore.nestedCategories" :key="parent.id">
            <!-- Divider above each parent (except first) -->
            <div v-if="pIdx > 0" class="border-t border-border" />

            <!-- Parent category row -->
            <CategoryListItem
              :category="parent"
              @edit="openEditSheet"
              @move-up="handleMoveUp"
              @move-down="handleMoveDown"
            />

            <!-- Sub-categories -->
            <template v-for="child in parent.children" :key="child.id">
              <div class="border-t border-border" />
              <CategoryListItem
                :category="child"
                :is-sub-category="true"
                @edit="openEditSheet"
                @move-up="handleMoveUp"
                @move-down="handleMoveDown"
              />
            </template>
          </template>
        </div>

        <!-- Add Category button -->
        <button
          type="button"
          class="text-body flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border font-medium text-text-secondary transition-colors duration-150 hover:border-primary hover:text-primary"
          @click="showAddSheet = true"
        >
          <span aria-hidden="true" class="text-lg leading-none">+</span>
          Add Category
        </button>
      </template>

      <!-- Error banner -->
      <p
        v-if="categoriesStore.error"
        class="text-caption mt-4 rounded-xl bg-danger/10 px-4 py-3 text-danger"
        role="alert"
      >
        {{ categoriesStore.error }}
      </p>
    </div>

    <!-- Add Category Sheet -->
    <AddCategorySheet
      :open="showAddSheet"
      @close="showAddSheet = false"
      @created="() => {}"
    />

    <!-- Edit Category Sheet -->
    <EditCategorySheet
      :open="showEditSheet"
      :category="selectedCategory"
      @close="closeEditSheet"
      @saved="() => {}"
      @deleted="() => {}"
    />
  </div>
</template>
