<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { useResponsive } from '@/composables/useResponsive'

const props = defineProps<{
  /** Controls open/closed state */
  open: boolean
  /** Title shown in the modal header (desktop) or above drag handle (mobile) */
  title: string
  /** data-testid forwarded to the dialog root element */
  testId?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { isDesktop } = useResponsive()

// ── Escape key handler ────────────────────────────────────────
// Dedup: when an Escape keydown bubbles up AND is also dispatched directly on
// document in the same event loop turn, only emit once.
let escapeFired = false

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !props.open) return
  if (escapeFired) return
  escapeFired = true
  setTimeout(() => { escapeFired = false }, 0)
  emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

// ── Mobile swipe-to-dismiss ───────────────────────────────────
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const delta = e.changedTouches[0].clientY - touchStartY
  if (delta > 60) emit('close')
}
</script>

<template>
  <!-- ── DESKTOP MODAL ── -->
  <template v-if="isDesktop">
    <!-- Backdrop -->
    <Transition name="modal-backdrop">
      <div
        v-if="open"
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
        aria-hidden="true"
        @click.self="emit('close')"
      >
        <!-- Panel -->
        <Transition name="modal-panel">
          <div
            v-if="open"
            class="relative z-50 mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface"
            :style="{ boxShadow: 'var(--shadow-sheet)' }"
            role="dialog"
            aria-modal="true"
            :aria-label="title"
            :data-testid="testId"
            @keydown.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 class="text-section-title font-semibold text-text-primary">{{ title }}</h2>
              <button
                type="button"
                class="text-text-muted transition-colors duration-150 hover:text-text-secondary"
                :aria-label="`Close ${title}`"
                @click="emit('close')"
              >
                <X :size="20" />
              </button>
            </div>
            <!-- Body -->
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </template>

  <!-- ── MOBILE BOTTOM SHEET ── -->
  <template v-else>
    <!-- Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="open"
        class="fixed inset-0 z-40 bg-black/40"
        aria-hidden="true"
        @click="emit('close')"
      />
    </Transition>

    <!-- Sheet -->
    <Transition name="sheet">
      <div
        v-if="open"
        class="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface pb-safe"
        :style="{ boxShadow: 'var(--shadow-sheet)' }"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        :data-testid="testId"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
        @keydown.stop
      >
        <!-- Drag handle + title -->
        <div class="flex flex-col items-center pb-1 pt-3">
          <div class="h-1 w-8 rounded-full bg-border" aria-hidden="true" />
          <h2 class="mt-3 px-5 text-section-title font-semibold text-text-primary">{{ title }}</h2>
        </div>
        <slot />
      </div>
    </Transition>
  </template>
</template>

<style scoped>
/* Mobile sheet animations (unchanged) */
.backdrop-enter-active { transition: opacity 0.2s ease; }
.backdrop-leave-active { transition: opacity 0.15s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.sheet-enter-active { transition: transform 0.25s ease; }
.sheet-leave-active { transition: transform 0.2s ease; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }

/* Desktop modal animations */
.modal-backdrop-enter-active { transition: opacity 0.2s ease-out; }
.modal-backdrop-leave-active { transition: opacity 0.15s ease-in; }
.modal-backdrop-enter-from, .modal-backdrop-leave-to { opacity: 0; }

.modal-panel-enter-active { transition: opacity 0.2s ease-out, transform 0.2s ease-out; }
.modal-panel-leave-active { transition: opacity 0.15s ease-in, transform 0.15s ease-in; }
.modal-panel-enter-from, .modal-panel-leave-to { opacity: 0; transform: scale(0.95); }
</style>
