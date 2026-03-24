<script lang="ts">
// ── Types & utilities exported for use by parent components ───────────────────

export type PresetKey = '3M' | '6M' | '12M' | 'YTD' | 'Custom'

export interface DateRange {
  startMonth: string // YYYY-MM
  endMonth: string   // YYYY-MM
}

/** Returns "YYYY-MM" for a Date. */
function toYearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Subtracts `n` months from the current month, returns "YYYY-MM". */
function monthsAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n + 1)
  return toYearMonth(d)
}

/** Returns "YYYY-01" (January of the current year). */
function ytdStart(): string {
  return `${new Date().getFullYear()}-01`
}

function currentMonth(): string {
  return toYearMonth(new Date())
}

export function presetToRange(preset: PresetKey): DateRange | null {
  const end = currentMonth()
  switch (preset) {
    case '3M':  return { startMonth: monthsAgo(3),  endMonth: end }
    case '6M':  return { startMonth: monthsAgo(6),  endMonth: end }
    case '12M': return { startMonth: monthsAgo(12), endMonth: end }
    case 'YTD': return { startMonth: ytdStart(),     endMonth: end }
    default: return null
  }
}
</script>

<script setup lang="ts">
import { ref } from 'vue'

// ── Props / Emits ─────────────────────────────────────────────────────────────

const emit = defineEmits<{
  change: [range: DateRange]
  'open-custom': []
}>()

// ── State ─────────────────────────────────────────────────────────────────────

const activePreset = ref<PresetKey>('3M')

const presets: PresetKey[] = ['3M', '6M', '12M', 'YTD', 'Custom']

// ── Handlers ──────────────────────────────────────────────────────────────────

function selectPreset(preset: PresetKey) {
  activePreset.value = preset
  if (preset === 'Custom') {
    emit('open-custom')
    return
  }
  const range = presetToRange(preset)
  if (range) emit('change', range)
}

/** Called externally (from parent) to mark Custom as active without re-opening sheet. */
function setCustomActive() {
  activePreset.value = 'Custom'
}

defineExpose({ setCustomActive })
</script>

<template>
  <div
    class="flex gap-2 overflow-x-auto px-4 py-3"
    data-testid="time-range-selector"
    role="group"
    aria-label="Time range"
  >
    <button
      v-for="preset in presets"
      :key="preset"
      type="button"
      class="flex-shrink-0 rounded-lg px-3 py-1.5 text-caption font-medium transition-colors duration-150"
      :class="
        activePreset === preset
          ? 'bg-primary text-white'
          : 'bg-surface-muted text-secondary hover:text-primary'
      "
      :data-testid="`preset-${preset.toLowerCase()}`"
      :aria-pressed="activePreset === preset"
      @click="selectPreset(preset)"
    >
      {{ preset }}
    </button>
  </div>
</template>
