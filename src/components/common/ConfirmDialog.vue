<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  /** Controls open/closed state */
  open: boolean
  /** Dialog title, e.g. "Delete transaction?" */
  title: string
  /** Description text, e.g. "This action cannot be undone." */
  description: string
  /** Label for the confirm button (default: "Delete") */
  confirmLabel?: string
  /** Visual variant of the confirm button (default: "danger") */
  variant?: 'danger' | 'warning'
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()

const confirmLabel = props.confirmLabel ?? 'Delete'
</script>

<template>
  <Transition name="backdrop">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6"
      data-testid="confirm-dialog-backdrop"
      @click.self="emit('cancel')"
    >
      <div
        class="w-full max-w-sm rounded-2xl bg-surface p-6"
        :style="{ boxShadow: 'var(--shadow-sheet)' }"
        role="alertdialog"
        aria-modal="true"
        :aria-label="title"
        data-testid="confirm-dialog"
      >
        <!-- Icon -->
        <div class="mb-3 flex justify-center">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
            <Trash2 :size="24" class="text-danger" aria-hidden="true" />
          </div>
        </div>

        <!-- Title -->
        <h3
          class="text-sub-title mb-2 text-center font-semibold text-text-primary"
          data-testid="confirm-dialog-title"
        >
          {{ title }}
        </h3>

        <!-- Description -->
        <p
          class="text-body mb-6 text-center text-text-secondary"
          data-testid="confirm-dialog-description"
        >
          {{ description }}
        </p>

        <!-- Buttons -->
        <div class="flex gap-3">
          <button
            type="button"
            class="text-body h-11 flex-1 rounded-xl border border-border font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            data-testid="confirm-dialog-cancel-btn"
            @click="emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="text-body h-11 flex-1 rounded-xl font-medium text-white transition-opacity hover:opacity-90"
            :style="{ backgroundColor: variant === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)' }"
            data-testid="confirm-dialog-confirm-btn"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.backdrop-enter-active { transition: opacity 0.2s ease; }
.backdrop-leave-active { transition: opacity 0.15s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
</style>
