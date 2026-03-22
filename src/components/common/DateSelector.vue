<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [date: string]
}>()

const today = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

const displayLabel = computed(() => {
  if (props.modelValue === today.value) return 'Today'
  if (!props.modelValue) return 'Today'
  const [year, month, day] = props.modelValue.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})

function onDateChange(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="relative flex h-10 items-center gap-2 rounded-xl bg-surface-muted px-3">
    <CalendarDays :size="16" class="shrink-0 text-text-muted" />
    <span class="text-body font-medium text-text-primary">{{ displayLabel }}</span>
    <!-- Native date input overlaid for tap interaction -->
    <input
      type="date"
      :value="modelValue || today"
      class="absolute inset-0 cursor-pointer opacity-0"
      aria-label="Select date"
      @change="onDateChange"
    />
  </div>
</template>
