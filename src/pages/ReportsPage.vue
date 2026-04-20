<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BarChart3, Download } from 'lucide-vue-next'
import TimeRangeSelector from '@/components/reports/TimeRangeSelector.vue'
import CustomDateRangeSheet from '@/components/reports/CustomDateRangeSheet.vue'
import TrendsSummaryCards from '@/components/reports/TrendsSummaryCards.vue'
import SpendingTrendsChart from '@/components/reports/SpendingTrendsChart.vue'
import IncomeExpensesChart from '@/components/reports/IncomeExpensesChart.vue'
import CategoryBreakdownChart from '@/components/reports/CategoryBreakdownChart.vue'
import ExportSheet from '@/components/export/ExportSheet.vue'
import type { DateRange } from '@/components/reports/TimeRangeSelector.vue'
import { callSpendingTrends, type SpendingTrendsResult } from '@/graphql/queries/reports'
import { presetToRange } from '@/components/reports/TimeRangeSelector.vue'

// ── State ─────────────────────────────────────────────────────────────────────

const timeRangeSelectorRef = ref<InstanceType<typeof TimeRangeSelector> | null>(null)

const customSheetOpen = ref(false)
const currentRange = ref<DateRange | null>(null)

const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<SpendingTrendsResult | null>(null)
const showExportSheet = ref(false)

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadData(range: DateRange) {
  loading.value = true
  error.value = null
  try {
    result.value = await callSpendingTrends(range.startMonth, range.endMonth)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load reports.'
  } finally {
    loading.value = false
  }
}

// ── Handlers ──────────────────────────────────────────────────────────────────

function onRangeChange(range: DateRange) {
  currentRange.value = range
  loadData(range)
}

function onOpenCustom() {
  customSheetOpen.value = true
}

function onCustomApply(range: DateRange) {
  customSheetOpen.value = false
  currentRange.value = range
  timeRangeSelectorRef.value?.setCustomActive()
  loadData(range)
}

// ── Init: default to 3M ───────────────────────────────────────────────────────

onMounted(() => {
  const initial = presetToRange('3M')
  if (initial) {
    currentRange.value = initial
    loadData(initial)
  }
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-background" data-testid="reports-page">
    <!-- Header -->
    <header
      class="flex items-center gap-3 bg-surface px-4 pt-safe pb-0"
      :style="{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }"
      data-testid="reports-header"
    >
      <div class="flex items-center gap-2 py-4">
        <BarChart3 :size="22" class="text-primary flex-shrink-0" />
        <h1 class="text-heading font-bold text-text-primary" data-testid="reports-heading">
          Reports
        </h1>
      </div>
      <button
        type="button"
        class="ml-auto rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary"
        aria-label="Export transactions"
        data-testid="export-trigger"
        @click="showExportSheet = true"
      >
        <Download :size="20" />
      </button>
    </header>

    <!-- Time Range Selector -->
    <TimeRangeSelector
      ref="timeRangeSelectorRef"
      data-testid="time-range-selector"
      @change="onRangeChange"
      @open-custom="onOpenCustom"
    />

    <!-- Custom Date Range Sheet -->
    <CustomDateRangeSheet
      :open="customSheetOpen"
      :initial-range="currentRange ?? undefined"
      @close="customSheetOpen = false"
      @apply="onCustomApply"
    />

    <!-- Loading state -->
    <div
      v-if="loading"
      class="flex flex-1 items-center justify-center py-20"
      data-testid="reports-loading"
    >
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="mx-4 mt-6 rounded-xl bg-danger/10 px-4 py-3 text-body text-danger"
      data-testid="reports-error"
    >
      {{ error }}
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col gap-6 pb-24 pt-2" data-testid="reports-content">
      <!-- Summary cards -->
      <TrendsSummaryCards :months="result?.months ?? []" />

      <!-- Spending Trends Line Chart -->
      <section
        class="mx-4 rounded-xl bg-surface p-4"
        :style="{ boxShadow: 'var(--shadow-card)' }"
        data-testid="reports-trends-section"
      >
        <SpendingTrendsChart :months="result?.months ?? []" />
      </section>

      <!-- Income vs Expenses Bar Chart -->
      <section
        class="mx-4 rounded-xl bg-surface p-4"
        :style="{ boxShadow: 'var(--shadow-card)' }"
        data-testid="reports-income-expenses-section"
      >
        <IncomeExpensesChart :months="result?.months ?? []" />
      </section>

      <!-- Category Breakdown Doughnut Chart -->
      <section
        class="mx-4 rounded-xl bg-surface p-4"
        :style="{ boxShadow: 'var(--shadow-card)' }"
        data-testid="reports-category-section"
      >
        <p class="mb-3 text-body font-semibold text-text-primary">Category Breakdown</p>
        <CategoryBreakdownChart :categories="result?.categoryBreakdown ?? []" />
      </section>
    </div>

    <!-- Export Sheet -->
    <ExportSheet :open="showExportSheet" @close="showExportSheet = false" />
  </div>
</template>
