<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SearchFilters } from '@/composables/useSearch'
import { createEmptyFilters } from '@/composables/useSearch'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'
import type { Category, Account } from '@/types'

const props = defineProps<{
  open: boolean
  modelValue: SearchFilters
  categories: Category[]
  accounts: Account[]
  availableTags: string[]
}>()

const emit = defineEmits<{
  close: []
  apply: [filters: SearchFilters]
}>()

// Local draft — edited here, only applied on "Apply"
const draft = ref<SearchFilters>(createEmptyFilters())

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Clone current filters into draft
      draft.value = { ...props.modelValue, tags: [...props.modelValue.tags] }
    }
  },
)

function toggleTag(tag: string) {
  const idx = draft.value.tags.indexOf(tag)
  if (idx >= 0) {
    draft.value = { ...draft.value, tags: draft.value.tags.filter((t) => t !== tag) }
  } else {
    draft.value = { ...draft.value, tags: [...draft.value.tags, tag] }
  }
}

function clearDraft() {
  draft.value = createEmptyFilters()
}

function applyDraft() {
  emit('apply', { ...draft.value, tags: [...draft.value.tags] })
  emit('close')
}
</script>

<template>
  <ResponsiveSheet :open="open" title="Filters" test-id="search-filter-sheet" @close="emit('close')">
    <div class="px-5 pb-6 pt-2 space-y-5">
      <!-- Date Range -->
      <div>
        <p class="text-caption text-text-secondary mb-2 font-medium">Date Range</p>
        <div class="flex gap-2">
          <input
            v-model="draft.startDate"
            type="date"
            class="flex-1 h-12 rounded-xl bg-surface-muted px-4 text-body text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
            data-testid="filter-start-date"
          />
          <input
            v-model="draft.endDate"
            type="date"
            class="flex-1 h-12 rounded-xl bg-surface-muted px-4 text-body text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
            data-testid="filter-end-date"
          />
        </div>
      </div>

      <!-- Category -->
      <div>
        <p class="text-caption text-text-secondary mb-2 font-medium">Category</p>
        <select
          v-model="draft.categoryId"
          class="w-full h-12 rounded-xl bg-surface-muted px-4 text-body text-text-primary outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
          data-testid="filter-category"
        >
          <option :value="null">All categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.icon }} {{ cat.name }}
          </option>
        </select>
      </div>

      <!-- Account -->
      <div>
        <p class="text-caption text-text-secondary mb-2 font-medium">Account</p>
        <select
          v-model="draft.accountId"
          class="w-full h-12 rounded-xl bg-surface-muted px-4 text-body text-text-primary outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
          data-testid="filter-account"
        >
          <option :value="null">All accounts</option>
          <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
            {{ acc.name }}
          </option>
        </select>
      </div>

      <!-- Type -->
      <div>
        <p class="text-caption text-text-secondary mb-2 font-medium">Type</p>
        <div class="flex rounded-xl bg-surface-muted p-0.5 gap-0.5" data-testid="filter-type-toggle">
          <button
            v-for="opt in [
              { value: null, label: 'All' },
              { value: 'EXPENSE', label: 'Expense' },
              { value: 'INCOME', label: 'Income' },
              { value: 'TRANSFER', label: 'Transfer' },
            ]"
            :key="String(opt.value)"
            type="button"
            class="flex-1 rounded-lg py-2 text-caption font-medium transition-colors duration-150"
            :class="
              draft.type === opt.value
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            "
            :data-testid="`filter-type-${String(opt.value ?? 'all').toLowerCase()}`"
            @click="draft.type = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Amount Range -->
      <div>
        <p class="text-caption text-text-secondary mb-2 font-medium">Amount Range</p>
        <div class="flex gap-2">
          <input
            v-model="draft.minAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Min ($)"
            class="flex-1 h-12 rounded-xl bg-surface-muted px-4 text-body text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20"
            data-testid="filter-min-amount"
          />
          <input
            v-model="draft.maxAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Max ($)"
            class="flex-1 h-12 rounded-xl bg-surface-muted px-4 text-body text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20"
            data-testid="filter-max-amount"
          />
        </div>
      </div>

      <!-- Tags -->
      <div v-if="availableTags.length > 0">
        <p class="text-caption text-text-secondary mb-2 font-medium">Tags</p>
        <div class="flex flex-wrap gap-2" data-testid="filter-tags">
          <button
            v-for="tag in availableTags"
            :key="tag"
            type="button"
            class="px-3 py-1.5 rounded-full text-caption font-medium cursor-pointer transition-colors duration-150"
            :class="
              draft.tags.includes(tag)
                ? 'bg-primary text-white'
                : 'bg-surface-muted text-text-secondary hover:text-text-primary'
            "
            :data-testid="`filter-tag-${tag}`"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3 pt-1">
        <button
          type="button"
          class="flex-1 h-11 rounded-xl text-body font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          data-testid="filter-clear-btn"
          @click="clearDraft"
        >
          Clear Filters
        </button>
        <button
          type="button"
          class="flex-1 h-11 rounded-xl bg-primary text-body font-medium text-white transition-opacity hover:opacity-90"
          data-testid="filter-apply-btn"
          @click="applyDraft"
        >
          Apply
        </button>
      </div>
    </div>
  </ResponsiveSheet>
</template>
