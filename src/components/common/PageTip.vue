<script setup lang="ts">
import { ref, computed } from 'vue'
import { Info, X } from 'lucide-vue-next'
import { PAGE_TIPS, SIGNUP_TIMESTAMP_KEY, TIP_VISIBLE_DAYS } from '@/utils/constants'

const props = defineProps<{
  /** Key from PAGE_TIPS map — also used as part of the localStorage dismiss key */
  pageKey: string
}>()

const DISMISS_KEY = `tip_dismissed_${props.pageKey}`

/** Whether the user signed up within the last TIP_VISIBLE_DAYS days */
function isNewUser(): boolean {
  try {
    const ts = localStorage.getItem(SIGNUP_TIMESTAMP_KEY)
    if (!ts) return false
    const signupDate = new Date(ts)
    if (isNaN(signupDate.getTime())) return false
    const diffMs = Date.now() - signupDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays < TIP_VISIBLE_DAYS
  } catch {
    return false
  }
}

/** Whether the tip has been dismissed by the user */
function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'true'
  } catch {
    return false
  }
}

const message = computed(() => PAGE_TIPS[props.pageKey] ?? '')
const visible = ref(isNewUser() && !isDismissed() && !!message.value)

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, 'true')
  } catch {
    // localStorage unavailable — just hide visually
  }
  visible.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="visible"
      class="relative mx-4 mt-2 rounded-xl border border-primary/15 bg-primary/5 p-3 pr-8"
      :data-testid="`page-tip-${pageKey}`"
      role="note"
      :aria-label="`Tip for ${pageKey} page`"
    >
      <!-- Layout: icon + text -->
      <div class="flex gap-2">
        <Info
          :size="16"
          class="mt-0.5 flex-shrink-0 text-primary"
          aria-hidden="true"
        />
        <p class="text-caption leading-relaxed text-text-secondary">{{ message }}</p>
      </div>

      <!-- Dismiss button -->
      <button
        type="button"
        class="absolute right-2 top-2 text-text-muted transition-colors hover:text-text-secondary"
        :aria-label="`Dismiss ${pageKey} tip`"
        data-testid="page-tip-dismiss"
        @click="dismiss"
      >
        <X :size="14" aria-hidden="true" />
      </button>
    </div>
  </Transition>
</template>
