<script setup lang="ts">
import { computed, ref } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import type { TrendCategorySpending } from '@/graphql/queries/reports'
import { formatCurrency } from '@/utils/currency'

ChartJS.register(ArcElement, Tooltip, Legend)

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  categories: TrendCategorySpending[]
}>()

// ── State ─────────────────────────────────────────────────────────────────────

const selectedCategoryId = ref<string | null | undefined>(undefined)

// ── Colors ────────────────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280',
]

function categoryColor(cat: TrendCategorySpending, index: number): string {
  return cat.categoryColor ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}

// ── Chart data ────────────────────────────────────────────────────────────────

const chartData = computed(() => ({
  labels: props.categories.map((c) => c.categoryName),
  datasets: [
    {
      data: props.categories.map((c) => c.amount),
      backgroundColor: props.categories.map((c, i) => categoryColor(c, i)),
      borderColor: 'transparent',
      borderWidth: 2,
      hoverOffset: 8,
    },
  ],
}))

const chartOptions = computed(() => ({
  cutout: '65%',
  animation: { duration: 600, easing: 'easeInOutQuart' as const },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { dataIndex: number }) => {
          const cat = props.categories[ctx.dataIndex]
          return ` ${cat.categoryName}: ${formatCurrency(cat.amount)} (${Math.round(cat.percentage)}%)`
        },
      },
    },
  },
}))

// ── Derived ───────────────────────────────────────────────────────────────────

const totalExpenses = computed(() =>
  props.categories.reduce((sum, c) => sum + c.amount, 0),
)

// ── Legend interaction ────────────────────────────────────────────────────────

function onLegendClick(cat: TrendCategorySpending) {
  const id = cat.categoryId
  if (selectedCategoryId.value === id) {
    selectedCategoryId.value = undefined
  } else {
    selectedCategoryId.value = id
  }
}
</script>

<template>
  <div data-testid="category-breakdown-chart">
    <!-- Empty state -->
    <div
      v-if="categories.length === 0"
      class="flex h-[200px] items-center justify-center"
      data-testid="category-breakdown-empty"
    >
      <p class="text-caption text-muted">No category data for this period</p>
    </div>

    <template v-else>
      <!-- Doughnut chart -->
      <div class="relative mx-auto w-44 h-44" data-testid="chart-canvas-wrapper">
        <Doughnut
          :data="chartData"
          :options="chartOptions"
          data-testid="doughnut-chart"
        />
        <!-- Center total -->
        <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-caption text-text-muted">Total</span>
          <span class="text-body font-bold tabular-nums text-text-primary" data-testid="chart-total">
            {{ formatCurrency(totalExpenses) }}
          </span>
        </div>
      </div>

      <!-- Legend -->
      <div class="mt-4 divide-y divide-border" data-testid="category-breakdown-legend">
        <button
          v-for="(cat, index) in categories"
          :key="cat.categoryId ?? cat.categoryName"
          type="button"
          class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-muted"
          :class="selectedCategoryId === cat.categoryId ? 'bg-primary/5 ring-1 ring-primary/20' : ''"
          :data-testid="`breakdown-legend-row-${cat.categoryId ?? index}`"
          @click="onLegendClick(cat)"
        >
          <!-- Color dot -->
          <span
            class="h-3 w-3 shrink-0 rounded-full"
            :style="{ backgroundColor: categoryColor(cat, index) }"
            data-testid="breakdown-legend-color-dot"
          />
          <!-- Icon -->
          <span v-if="cat.categoryIcon" class="text-base" aria-hidden="true">
            {{ cat.categoryIcon }}
          </span>
          <!-- Name -->
          <span class="flex-1 text-body text-text-primary" data-testid="breakdown-legend-name">
            {{ cat.categoryName }}
          </span>
          <!-- Amount -->
          <span class="text-body font-medium tabular-nums text-text-primary" data-testid="breakdown-legend-amount">
            {{ formatCurrency(cat.amount) }}
          </span>
          <!-- Percentage -->
          <span class="text-caption text-text-muted" data-testid="breakdown-legend-percent">
            {{ Math.round(cat.percentage) }}%
          </span>
        </button>
      </div>
    </template>
  </div>
</template>
