<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import type { MonthlySortOption } from '@/graphql/queries/history'

const props = defineProps<{
  modelValue: MonthlySortOption
}>()

const emit = defineEmits<{
  'update:modelValue': [sort: MonthlySortOption]
}>()

const SORT_OPTIONS: { value: MonthlySortOption; label: string }[] = [
  { value: 'CHRONOLOGICAL_DESC', label: 'Most Recent' },
  { value: 'CHRONOLOGICAL_ASC', label: 'Oldest First' },
  { value: 'HIGHEST_EXPENSES', label: 'Highest Expenses' },
  { value: 'LOWEST_EXPENSES', label: 'Lowest Expenses' },
  { value: 'HIGHEST_PERCENT_SPENT', label: 'Highest % Spent' },
  { value: 'LOWEST_PERCENT_SPENT', label: 'Lowest % Spent' },
]

function onChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as MonthlySortOption
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="relative inline-flex items-center" data-testid="sort-controls">
    <span class="text-caption font-medium text-text-muted">Sort:</span>
    <div class="relative ml-1.5">
      <select
        class="h-9 cursor-pointer appearance-none rounded-xl bg-surface-muted py-0 pl-3 pr-7 text-caption font-medium text-primary focus:outline-none focus:ring-1 focus:ring-primary"
        :value="modelValue"
        aria-label="Sort months"
        data-testid="sort-select"
        @change="onChange"
      >
        <option
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          :value="opt.value"
          :data-testid="`sort-option-${opt.value}`"
        >
          {{ opt.label }}
        </option>
      </select>
      <ChevronDown
        :size="14"
        class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  </div>
</template>
