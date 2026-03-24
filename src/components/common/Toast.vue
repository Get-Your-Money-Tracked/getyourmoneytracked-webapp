<script setup lang="ts">
import { computed } from 'vue'
import { X, Check, AlertCircle, Info } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'
import type { ToastVariant } from '@/stores/toast'

const toastStore = useToastStore()

const toasts = computed(() => toastStore.toasts)

function variantClasses(variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return 'bg-primary text-white'
    case 'error':
      return 'bg-danger text-white'
    case 'info':
      return 'bg-info text-white'
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed left-0 right-0 top-0 z-[100] flex flex-col items-center gap-2 p-4"
      aria-live="polite"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex w-full max-w-sm flex-col items-center gap-2"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto relative w-full overflow-hidden rounded-xl px-4 py-3 text-body font-medium shadow-lg"
          :class="variantClasses(toast.variant)"
          role="status"
        >
          <!-- Main row -->
          <div class="flex items-center gap-2">
            <Check v-if="toast.variant === 'success'" :size="18" class="shrink-0" />
            <AlertCircle v-else-if="toast.variant === 'error'" :size="18" class="shrink-0" />
            <Info v-else :size="18" class="shrink-0" />
            <span class="flex-1">{{ toast.message }}</span>
            <!-- Undo / action button -->
            <button
              v-if="toast.action"
              type="button"
              class="ml-1 shrink-0 rounded px-2 py-0.5 text-caption font-semibold underline underline-offset-2 opacity-90 transition-opacity hover:opacity-100"
              :data-testid="`toast-action-${toast.id}`"
              @click="toast.action!.callback(); toastStore.dismiss(toast.id)"
            >
              {{ toast.action.label }}
            </button>
            <!-- Dismiss button -->
            <button
              type="button"
              class="ml-1 shrink-0 rounded p-0.5 opacity-80 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
              @click="toastStore.dismiss(toast.id)"
            >
              <X :size="14" />
            </button>
          </div>

          <!-- Countdown progress bar (only shown when there's an action) -->
          <div
            v-if="toast.action"
            class="countdown-bar absolute bottom-0 left-0 h-0.5 bg-white/50"
            :style="{ animationDuration: `${toast.duration}ms` }"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Toast entrance: slide down from top */
.toast-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
.toast-move {
  transition: transform 0.2s ease;
}

/* Countdown progress bar animation */
@keyframes countdown {
  from { width: 100%; }
  to   { width: 0%; }
}
.countdown-bar {
  animation: countdown linear forwards;
}
</style>
