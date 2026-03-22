<script setup lang="ts">
import { computed } from 'vue'
import { Search, Tag, X } from 'lucide-vue-next'
import type { Account, Category } from '@/types'
import type { TransactionFilter } from '@/graphql/queries/transactions'

const props = defineProps<{
  modelValue: TransactionFilter
  accounts: Account[]
  categories: Category[]
}>()

const emit = defineEmits<{
  'update:modelValue': [filter: TransactionFilter]
}>()

const TYPE_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'EXPENSE', label: 'Expenses' },
  { value: 'INCOME', label: 'Income' },
  { value: 'TRANSFER', label: 'Transfers' },
] as const

function setType(type: string | null) {
  emit('update:modelValue', { ...props.modelValue, type })
}

function setCategory(categoryId: string | null) {
  emit('update:modelValue', { ...props.modelValue, categoryId })
}

function setAccount(accountId: string | null) {
  emit('update:modelValue', { ...props.modelValue, accountId })
}

function setSearch(search: string) {
  emit('update:modelValue', { ...props.modelValue, search: search || null })
}

function clearSearch() {
  emit('update:modelValue', { ...props.modelValue, search: null })
}

function setTag(tag: string) {
  const sanitized = tag.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || null
  emit('update:modelValue', {
    ...props.modelValue,
    tags: sanitized ? [sanitized] : null,
  })
}

function clearTag() {
  emit('update:modelValue', { ...props.modelValue, tags: null })
}

const currentTag = computed(() => {
  const tags = props.modelValue.tags
  return tags && tags.length > 0 ? tags[0] : ''
})

const topLevelCategories = computed(() =>
  props.categories.filter((c) => c.parentId === null),
)
</script>

<template>
  <div class="flex gap-2 overflow-x-auto px-4 py-2 pb-3" style="-webkit-overflow-scrolling: touch">
    <!-- Type filter chips -->
    <div class="flex gap-1.5 shrink-0">
      <button
        v-for="opt in TYPE_OPTIONS"
        :key="String(opt.value)"
        type="button"
        class="text-caption flex h-8 items-center rounded-full px-3 font-medium transition-colors"
        :class="
          modelValue.type === opt.value
            ? 'bg-primary/10 text-primary ring-1 ring-primary'
            : 'bg-surface-muted text-text-secondary hover:bg-surface-elevated'
        "
        @click="setType(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Category filter -->
    <div class="relative shrink-0">
      <select
        class="text-caption h-8 appearance-none rounded-full px-3 pr-6 font-medium transition-colors"
        :class="
          modelValue.categoryId
            ? 'bg-primary/10 text-primary ring-1 ring-primary'
            : 'bg-surface-muted text-text-secondary'
        "
        :value="modelValue.categoryId ?? ''"
        aria-label="Filter by category"
        @change="setCategory(($event.target as HTMLSelectElement).value || null)"
      >
        <option value="">Category</option>
        <option v-for="cat in topLevelCategories" :key="cat.id" :value="cat.id">
          {{ cat.icon ? cat.icon + ' ' : '' }}{{ cat.name }}
        </option>
      </select>
      <X
        v-if="modelValue.categoryId"
        :size="12"
        class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-primary"
      />
    </div>

    <!-- Account filter -->
    <div class="relative shrink-0">
      <select
        class="text-caption h-8 appearance-none rounded-full px-3 pr-6 font-medium transition-colors"
        :class="
          modelValue.accountId
            ? 'bg-primary/10 text-primary ring-1 ring-primary'
            : 'bg-surface-muted text-text-secondary'
        "
        :value="modelValue.accountId ?? ''"
        aria-label="Filter by account"
        @change="setAccount(($event.target as HTMLSelectElement).value || null)"
      >
        <option value="">Account</option>
        <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
          {{ acc.icon ? acc.icon + ' ' : '' }}{{ acc.name }}
        </option>
      </select>
      <X
        v-if="modelValue.accountId"
        :size="12"
        class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-primary"
      />
    </div>

    <!-- Tag filter -->
    <div class="relative shrink-0">
      <Tag
        :size="14"
        class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="text"
        placeholder="Tag"
        :value="currentTag"
        class="text-caption h-8 w-20 rounded-full bg-surface-muted pl-7 pr-6 font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
        :class="currentTag ? 'bg-primary/10 ring-1 ring-primary' : ''"
        aria-label="Filter by tag"
        @input="setTag(($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="currentTag"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2"
        aria-label="Clear tag filter"
        @click="clearTag"
      >
        <X :size="12" class="text-primary" />
      </button>
    </div>

    <!-- Search -->
    <div class="relative shrink-0">
      <Search
        :size="14"
        class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="text"
        placeholder="Search"
        :value="modelValue.search ?? ''"
        class="text-caption h-8 rounded-full bg-surface-muted pl-7 pr-6 font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
        :class="modelValue.search ? 'bg-primary/10 ring-1 ring-primary' : ''"
        @input="setSearch(($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="modelValue.search"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2"
        aria-label="Clear search"
        @click="clearSearch"
      >
        <X :size="12" class="text-primary" />
      </button>
    </div>
  </div>
</template>
