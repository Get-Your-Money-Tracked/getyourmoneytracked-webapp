<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  tagName: string
  tagCount: number
}>()

const emit = defineEmits<{
  close: []
  rename: [newName: string]
}>()

const newName = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      newName.value = props.tagName
    }
  },
  { immediate: true },
)

function handleRename() {
  const trimmed = newName.value.trim()
  if (!trimmed || trimmed === props.tagName) return
  emit('rename', trimmed)
}

function handleBackdropClick() {
  emit('close')
}
</script>

<template>
  <Transition name="backdrop">
    <div
      v-if="open"
      class="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
      data-testid="rename-tag-dialog-backdrop"
      @click.self="handleBackdropClick"
    >
      <div
        class="w-full max-w-sm rounded-2xl bg-surface p-6"
        :style="{ boxShadow: 'var(--shadow-dropdown)' }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-tag-title"
        data-testid="rename-tag-dialog"
      >
        <h3
          id="rename-tag-title"
          class="text-card-title mb-4 font-semibold text-text-primary"
        >
          Rename tag
        </h3>

        <input
          v-model="newName"
          type="text"
          class="w-full h-12 rounded-xl border border-border bg-surface-muted px-4 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          data-testid="rename-tag-input"
          @keydown.enter="handleRename"
        />

        <p class="text-caption text-text-secondary mt-2 mb-5">
          This will update {{ tagCount }} {{ tagCount === 1 ? 'transaction' : 'transactions' }}.
        </p>

        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 h-11 rounded-xl border border-border text-body font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            data-testid="rename-tag-cancel-btn"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 h-11 rounded-xl bg-primary text-body font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            :disabled="!newName.trim() || newName.trim() === tagName"
            data-testid="rename-tag-confirm-btn"
            @click="handleRename"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.z-60 {
  z-index: 60;
}
</style>
