<script setup lang="ts">
import { ref, watch } from 'vue'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'
import type { DateRange } from './TimeRangeSelector.vue'

// ── Props / Emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  open: boolean
  initialRange?: DateRange
}>()

const emit = defineEmits<{
  close: []
  apply: [range: DateRange]
}>()

// ── State ─────────────────────────────────────────────────────────────────────

const startMonth = ref(props.initialRange?.startMonth ?? '')
const endMonth   = ref(props.initialRange?.endMonth ?? '')

// Sync with parent-provided initial range whenever sheet opens.
watch(
  () => props.open,
  (open) => {
    if (open && props.initialRange) {
      startMonth.value = props.initialRange.startMonth
      endMonth.value   = props.initialRange.endMonth
    }
  },
)

// ── Handlers ──────────────────────────────────────────────────────────────────

function handleApply() {
  if (!startMonth.value || !endMonth.value) return
  emit('apply', { startMonth: startMonth.value, endMonth: endMonth.value })
}
</script>

<template>
  <ResponsiveSheet
    :open="open"
    title="Custom Date Range"
    test-id="custom-date-range-sheet"
    @close="emit('close')"
  >
    <div class="space-y-4 p-4" data-testid="custom-date-range-content">
      <!-- Start Month -->
      <div>
        <label class="mb-1.5 block text-caption text-secondary" for="start-month">
          Start Month
        </label>
        <input
          id="start-month"
          v-model="startMonth"
          type="month"
          class="h-12 w-full rounded-xl bg-surface-muted px-4 text-body text-text-primary outline-none focus:ring-2 focus:ring-primary/40"
          data-testid="start-month-input"
        />
      </div>

      <!-- End Month -->
      <div>
        <label class="mb-1.5 block text-caption text-secondary" for="end-month">
          End Month
        </label>
        <input
          id="end-month"
          v-model="endMonth"
          type="month"
          class="h-12 w-full rounded-xl bg-surface-muted px-4 text-body text-text-primary outline-none focus:ring-2 focus:ring-primary/40"
          data-testid="end-month-input"
        />
      </div>

      <!-- Apply button -->
      <button
        type="button"
        class="h-11 w-full rounded-xl bg-primary font-medium text-white transition-colors duration-100 hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!startMonth || !endMonth"
        data-testid="apply-custom-range-btn"
        @click="handleApply"
      >
        Apply
      </button>
    </div>
  </ResponsiveSheet>
</template>
