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
      class="pointer-events-none fixed right-0 top-0 z-[100] flex flex-col items-end gap-2 p-4"
      aria-live="polite"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col items-end gap-2"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-body font-medium shadow-lg"
          :class="variantClasses(toast.variant)"
          role="status"
        >
          <Check v-if="toast.variant === 'success'" :size="18" class="shrink-0" />
          <AlertCircle v-else-if="toast.variant === 'error'" :size="18" class="shrink-0" />
          <Info v-else :size="18" class="shrink-0" />
          <span>{{ toast.message }}</span>
          <button
            type="button"
            class="ml-2 shrink-0 rounded p-0.5 opacity-80 transition-opacity hover:opacity-100"
            aria-label="Dismiss"
            @click="toastStore.dismiss(toast.id)"
          >
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
