<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useChartTheme } from '@/composables/useChartTheme'
import type { MonthlyTrend } from '@/graphql/queries/reports'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  months: MonthlyTrend[]
}>()

// ── Chart theme ───────────────────────────────────────────────────────────────

const { baseOptions, primaryColor, dangerColor } = useChartTheme()

// ── Chart data ────────────────────────────────────────────────────────────────

function formatMonthLabel(month: string): string {
  const d = new Date(month + 'T00:00:00Z')
  return d.toLocaleString('default', { month: 'short', timeZone: 'UTC' })
}

const labels = computed(() => props.months.map((m) => formatMonthLabel(m.month)))

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Income',
      data: props.months.map((m) => m.totalIncome),
      backgroundColor: `${primaryColor.value}cc`, // 80% opacity
      borderRadius: 4,
      barPercentage: 0.8,
      categoryPercentage: 0.6,
    },
    {
      label: 'Expenses',
      data: props.months.map((m) => m.totalExpenses),
      backgroundColor: `${dangerColor.value}cc`,
      borderRadius: 4,
      barPercentage: 0.8,
      categoryPercentage: 0.6,
    },
  ],
}))

const chartOptions = computed(() => ({
  ...baseOptions.value,
  plugins: {
    ...baseOptions.value.plugins,
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        boxHeight: 12,
        padding: 12,
      },
    },
  },
}))
</script>

<template>
  <div data-testid="income-expenses-chart">
    <p class="mb-3 text-body font-semibold text-text-primary">Income vs Expenses</p>

    <div
      v-if="months.length === 0"
      class="flex h-[200px] items-center justify-center"
      data-testid="income-expenses-empty"
    >
      <p class="text-caption text-muted">No data for this period</p>
    </div>
    <div v-else class="h-[200px] md:h-[280px]" data-testid="income-expenses-canvas-wrapper">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
