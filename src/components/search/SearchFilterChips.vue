<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import type { SearchFilters } from '@/composables/useSearch'
import type { Category, Account } from '@/types'

const props = defineProps<{
  filters: SearchFilters
  categories: Category[]
  accounts: Account[]
}>()

const emit = defineEmits<{
  remove: [key: keyof SearchFilters]
}>()

interface ActiveChip {
  key: keyof SearchFilters
  label: string
}

const chips = computed((): ActiveChip[] => {
  const f = props.filters
  const result: ActiveChip[] = []

  if (f.startDate && f.endDate) {
    result.push({ key: 'startDate', label: `${f.startDate} – ${f.endDate}` })
  } else if (f.startDate) {
    result.push({ key: 'startDate', label: `From ${f.startDate}` })
  } else if (f.endDate) {
    result.push({ key: 'endDate', label: `Until ${f.endDate}` })
  }

  if (f.categoryId) {
    const cat = props.categories.find((c) => c.id === f.categoryId)
    result.push({ key: 'categoryId', label: `Category: ${cat?.name ?? f.categoryId}` })
  }

  if (f.accountId) {
    const acc = props.accounts.find((a) => a.id === f.accountId)
    result.push({ key: 'accountId', label: `Account: ${acc?.name ?? f.accountId}` })
  }

  if (f.type) {
    const label = f.type.charAt(0) + f.type.slice(1).toLowerCase()
    result.push({ key: 'type', label })
  }

  if (f.minAmount && f.maxAmount) {
    result.push({ key: 'minAmount', label: `$${f.minAmount} – $${f.maxAmount}` })
  } else if (f.minAmount) {
    result.push({ key: 'minAmount', label: `> $${f.minAmount}` })
  } else if (f.maxAmount) {
    result.push({ key: 'maxAmount', label: `< $${f.maxAmount}` })
  }

  if (f.tags.length > 0) {
    result.push({ key: 'tags', label: `Tags: ${f.tags.join(', ')}` })
  }

  return result
})
</script>

<template>
  <div
    v-if="chips.length > 0"
    class="flex flex-wrap gap-2 px-4 mt-2"
    data-testid="filter-chips"
  >
    <span
      v-for="chip in chips"
      :key="chip.key"
      class="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-caption font-medium"
      :data-testid="`chip-${chip.key}`"
    >
      {{ chip.label }}
      <button
        type="button"
        class="shrink-0 hover:opacity-70 transition-opacity"
        :aria-label="`Remove ${chip.label} filter`"
        :data-testid="`chip-remove-${chip.key}`"
        @click="emit('remove', chip.key)"
      >
        <X :size="12" />
      </button>
    </span>
  </div>
</template>
