<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X } from 'lucide-vue-next'

const MAX_TAGS = 10
const MAX_TAG_LENGTH = 30

const props = defineProps<{
  modelValue: string[]
  suggestions?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [tags: string[]]
}>()

const inputText = ref('')
const showDropdown = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

function sanitizeTag(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '')
    .slice(0, MAX_TAG_LENGTH)
}

const filteredSuggestions = computed(() => {
  if (!inputText.value.trim() || !props.suggestions?.length) return []
  const q = inputText.value.toLowerCase()
  return props.suggestions.filter(
    (s) => s.toLowerCase().includes(q) && !props.modelValue.includes(s),
  )
})

function addTag(raw: string) {
  const tag = sanitizeTag(raw)
  if (!tag) return
  if (props.modelValue.includes(tag)) {
    inputText.value = ''
    showDropdown.value = false
    return
  }
  if (props.modelValue.length >= MAX_TAGS) return
  emit('update:modelValue', [...props.modelValue, tag])
  inputText.value = ''
  showDropdown.value = false
}

function removeTag(tag: string) {
  emit('update:modelValue', props.modelValue.filter((t) => t !== tag))
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag(inputText.value)
  } else if (e.key === 'Backspace' && inputText.value === '' && props.modelValue.length > 0) {
    removeTag(props.modelValue[props.modelValue.length - 1])
  }
}

function handleInput() {
  showDropdown.value = inputText.value.trim().length > 0 && (filteredSuggestions.value.length > 0)
}

watch(filteredSuggestions, (val) => {
  if (val.length === 0 && inputText.value.trim() === '') {
    showDropdown.value = false
  } else if (val.length > 0) {
    showDropdown.value = true
  }
})

function handleBlur() {
  // Delay so click on dropdown item fires first
  setTimeout(() => {
    showDropdown.value = false
  }, 150)
}

const atLimit = computed(() => props.modelValue.length >= MAX_TAGS)
</script>

<template>
  <div class="relative" data-testid="tag-input">
    <!-- Input container -->
    <div
      class="min-h-[48px] rounded-xl bg-surface-muted px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-text"
      data-testid="tag-input-container"
      @click="inputRef?.focus()"
    >
      <!-- Tag chips -->
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-caption font-medium"
        :data-testid="`tag-chip-${tag}`"
      >
        {{ tag }}
        <button
          type="button"
          class="flex items-center focus:outline-none"
          :data-testid="`tag-remove-${tag}`"
          @click.stop="removeTag(tag)"
        >
          <X :size="12" />
        </button>
      </span>

      <!-- Text input -->
      <input
        v-if="!atLimit"
        ref="inputRef"
        v-model="inputText"
        type="text"
        placeholder="Add tag..."
        class="bg-transparent text-body text-text-primary placeholder:text-text-muted outline-none min-w-[80px] flex-1"
        data-testid="tag-text-input"
        @keydown="handleKeydown"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleInput"
      />
      <span
        v-else
        class="text-caption text-text-muted"
        data-testid="tag-limit-message"
      >Max {{ MAX_TAGS }} tags</span>
    </div>

    <!-- Autocomplete dropdown -->
    <div
      v-if="showDropdown && filteredSuggestions.length > 0"
      class="absolute z-10 left-0 right-0 bg-surface rounded-xl mt-1 py-1 max-h-[160px] overflow-y-auto"
      :style="{ boxShadow: 'var(--shadow-dropdown)' }"
      data-testid="tag-suggestions"
    >
      <button
        v-for="suggestion in filteredSuggestions"
        :key="suggestion"
        type="button"
        class="w-full px-4 py-2 text-body text-text-primary hover:bg-surface-muted cursor-pointer text-left"
        :data-testid="`tag-suggestion-${suggestion}`"
        @mousedown.prevent="addTag(suggestion)"
      >
        {{ suggestion }}
      </button>
    </div>
  </div>
</template>
