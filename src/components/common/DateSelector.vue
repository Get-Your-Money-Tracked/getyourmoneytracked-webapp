<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarDays } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [date: string]
}>()

const dateInputRef = ref<HTMLInputElement | null>(null)

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

function triggerDatePicker() {
  if (!dateInputRef.value) return
  if (typeof dateInputRef.value.showPicker === 'function') {
    try {
      dateInputRef.value.showPicker()
    } catch {
      dateInputRef.value.click()
    }
  } else {
    dateInputRef.value.click()
  }
}
</script>

<template>
  <div
    class="relative flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-surface-muted px-3"
    @click="triggerDatePicker"
  >
    <CalendarDays :size="16" class="shrink-0 text-text-muted" />
    <span class="text-body font-medium text-text-primary">{{ displayLabel }}</span>
    <!-- Native date input overlaid for tap interaction -->
    <input
      ref="dateInputRef"
      type="date"
      :value="modelValue || today"
      class="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
      aria-label="Select date"
      @change="onDateChange"
    />
  </div>
</template>
