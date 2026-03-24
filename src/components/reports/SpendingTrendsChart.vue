<script setup lang="ts">
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'
import { useChartTheme } from '@/composables/useChartTheme'
import type { MonthlyTrend } from '@/graphql/queries/reports'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  months: MonthlyTrend[]
}>()

// ── State ─────────────────────────────────────────────────────────────────────

const showIncome = ref(false)
const { baseOptions, primaryColor, dangerColor } = useChartTheme()

// ── Chart data ────────────────────────────────────────────────────────────────

/** Format "YYYY-MM-01" → "Jan", "Feb", … */
function formatMonthLabel(month: string): string {
  const d = new Date(month + 'T00:00:00Z')
  return d.toLocaleString('default', { month: 'short', timeZone: 'UTC' })
}

const labels = computed(() => props.months.map((m) => formatMonthLabel(m.month)))

const chartData = computed(() => {
  const expensesDataset = {
    label: 'Expenses',
    data: props.months.map((m) => m.totalExpenses),
    borderColor: dangerColor.value,
    backgroundColor: `${dangerColor.value}1a`,
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
    tension: 0.3,
    fill: false,
  }

  const incomeDataset = {
    label: 'Income',
    data: props.months.map((m) => m.totalIncome),
    borderColor: primaryColor.value,
    backgroundColor: `${primaryColor.value}1a`,
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
    tension: 0.3,
    fill: false,
  }

  return {
    labels: labels.value,
    datasets: showIncome.value
      ? [expensesDataset, incomeDataset]
      : [expensesDataset],
  }
})

const chartOptions = computed(() => {
  const base = baseOptions.value
  const plugins = base.plugins ?? {}
  const tooltip = (plugins as Record<string, unknown>)?.tooltip ?? {}
  return {
    ...base,
    plugins: {
      ...plugins,
      tooltip: {
        ...(tooltip as Record<string, unknown>),
        callbacks: {
          label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
  }
})
</script>

<template>
  <div data-testid="spending-trends-chart">
    <!-- Income toggle -->
    <div class="mb-3 flex items-center justify-between">
      <span class="text-body font-semibold text-text-primary">Spending Trends</span>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-caption font-medium transition-colors duration-150"
        :class="showIncome ? 'bg-primary/10 text-primary' : 'bg-surface-muted text-secondary hover:text-primary'"
        data-testid="income-overlay-toggle"
        @click="showIncome = !showIncome"
      >
        {{ showIncome ? 'Hide Income' : 'Show Income' }}
      </button>
    </div>

    <!-- Chart or empty state -->
    <div
      v-if="months.length === 0"
      class="flex h-[200px] items-center justify-center"
      data-testid="spending-trends-empty"
    >
      <p class="text-caption text-muted">No data for this period</p>
    </div>
    <div v-else class="h-[200px] md:h-[280px]" data-testid="spending-trends-canvas-wrapper">
      <Line :data="chartData" :options="(chartOptions as any)" />
    </div>
  </div>
</template>
