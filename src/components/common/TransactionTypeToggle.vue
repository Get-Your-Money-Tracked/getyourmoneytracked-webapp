<script setup lang="ts">
import type { TransactionType } from '@/types'

const props = defineProps<{
  modelValue: TransactionType
}>()

const emit = defineEmits<{
  'update:modelValue': [type: TransactionType]
}>()

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
  { value: 'TRANSFER', label: 'Transfer' },
]

function activeClass(value: TransactionType): string {
  if (props.modelValue !== value) return 'text-text-secondary hover:text-text-primary'
  switch (value) {
    case 'EXPENSE':
      return 'bg-danger text-white shadow-sm'
    case 'INCOME':
      return 'bg-primary text-white shadow-sm'
    case 'TRANSFER':
      return 'bg-info text-white shadow-sm'
  }
}
</script>

<template>
  <div
    class="flex h-10 gap-1 rounded-xl bg-surface-muted p-1"
    role="radiogroup"
    aria-label="Transaction type"
  >
    <button
      v-for="opt in TYPE_OPTIONS"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === opt.value"
      class="text-caption flex flex-1 items-center justify-center rounded-lg font-medium transition-all duration-150"
      :class="activeClass(opt.value)"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
