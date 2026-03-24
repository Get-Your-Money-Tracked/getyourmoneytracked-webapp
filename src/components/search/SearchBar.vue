<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, X, SlidersHorizontal } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  activeFilterCount?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'open-filters': []
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function clearText() {
  emit('update:modelValue', '')
  inputRef.value?.focus()
}

// Mirror the debounce signal upward: parent watches modelValue and calls
// useSearch().onSearchTextChange() itself — SearchBar just emits.
watch(() => props.modelValue, () => {
  // nothing — parent handles debounce
})
</script>

<template>
  <div class="flex items-center gap-2 px-4 mt-3" data-testid="search-bar">
    <!-- Text input wrapper -->
    <div class="flex flex-1 items-center gap-2 rounded-xl bg-surface-muted h-12 px-4">
      <Search :size="18" class="shrink-0 text-text-muted" aria-hidden="true" />
      <input
        ref="inputRef"
        type="search"
        placeholder="Search transactions..."
        autocomplete="off"
        class="flex-1 bg-transparent text-body text-text-primary placeholder:text-text-muted outline-none"
        :value="modelValue"
        data-testid="search-input"
        @input="onInput"
      />
      <button
        v-if="modelValue"
        type="button"
        class="shrink-0 text-text-muted hover:text-text-secondary transition-colors"
        aria-label="Clear search"
        data-testid="search-clear-btn"
        @click="clearText"
      >
        <X :size="16" />
      </button>
    </div>

    <!-- Filter button -->
    <button
      type="button"
      class="relative w-12 h-12 flex items-center justify-center rounded-xl transition-colors"
      :class="activeFilterCount ? 'bg-primary/10 text-primary' : 'bg-surface-muted text-text-secondary hover:text-text-primary'"
      aria-label="Open filters"
      data-testid="filter-btn"
      @click="emit('open-filters')"
    >
      <SlidersHorizontal :size="20" />
      <!-- Active filter dot -->
      <span
        v-if="activeFilterCount"
        class="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"
        data-testid="filter-active-dot"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
