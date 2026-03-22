<script setup lang="ts">
import { computed, ref } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { CategorySpending } from '@/types'
import { formatCurrency } from '@/utils/currency'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  categories: CategorySpending[]
  currency: string
}>()

const emit = defineEmits<{
  /** Emits the categoryId when a category is selected, or null when deselected */
  'filter': [categoryId: string | null]
}>()

const selectedCategoryId = ref<string | null>(null)

// ── Chart data ────────────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280',
]

function categoryColor(cat: CategorySpending, index: number): string {
  return cat.categoryColor ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}

const chartData = computed<ChartData<'doughnut'>>(() => ({
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

const chartOptions = computed<ChartOptions<'doughnut'>>(() => ({
  cutout: '65%',
  animation: { duration: 600, easing: 'easeInOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const cat = props.categories[ctx.dataIndex]
          return ` ${cat.categoryName}: ${formatCurrency(cat.amount, props.currency)} (${Math.round(cat.percentage)}%)`
        },
      },
    },
  },
  onClick: (_event, elements) => {
    if (elements.length === 0) {
      // Clicked outside a slice — deselect
      toggleFilter(null)
      return
    }
    const index = elements[0].index
    const cat = props.categories[index]
    if (!cat) return
    toggleFilter(cat.categoryId)
  },
}))

function toggleFilter(categoryId: string | null | undefined) {
  const id = categoryId ?? null
  if (selectedCategoryId.value === id) {
    // Deselect
    selectedCategoryId.value = null
    emit('filter', null)
  } else {
    selectedCategoryId.value = id
    emit('filter', id)
  }
}

function onLegendClick(cat: CategorySpending) {
  toggleFilter(cat.categoryId)
}

const totalExpenses = computed(() =>
  props.categories.reduce((sum, c) => sum + c.amount, 0),
)
</script>

<template>
  <div data-testid="category-pie-chart">
    <!-- Donut chart -->
    <div class="relative mx-auto w-48 h-48" data-testid="chart-canvas-wrapper">
      <Doughnut
        :data="chartData"
        :options="chartOptions"
        data-testid="doughnut-chart"
      />
      <!-- Center label -->
      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
      >
        <span class="text-caption text-text-muted">Total</span>
        <span class="text-body font-bold tabular-nums text-text-primary" data-testid="chart-total">
          {{ formatCurrency(totalExpenses, currency) }}
        </span>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 divide-y divide-border" data-testid="chart-legend">
      <button
        v-for="(cat, index) in categories"
        :key="cat.categoryId ?? cat.categoryName"
        type="button"
        class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-muted"
        :class="
          selectedCategoryId === cat.categoryId
            ? 'bg-primary/5 ring-1 ring-primary/20'
            : ''
        "
        :data-testid="`legend-row-${cat.categoryId ?? index}`"
        @click="onLegendClick(cat)"
      >
        <!-- Color dot -->
        <span
          class="h-3 w-3 shrink-0 rounded-full"
          :style="{ backgroundColor: categoryColor(cat, index) }"
          data-testid="legend-color-dot"
        />
        <!-- Icon -->
        <span v-if="cat.categoryIcon" class="text-base" aria-hidden="true">
          {{ cat.categoryIcon }}
        </span>
        <!-- Name -->
        <span class="flex-1 text-body text-text-primary" data-testid="legend-name">
          {{ cat.categoryName }}
        </span>
        <!-- Amount -->
        <span class="text-body font-medium tabular-nums text-text-primary" data-testid="legend-amount">
          {{ formatCurrency(cat.amount, currency) }}
        </span>
        <!-- Percentage -->
        <span class="text-caption text-text-muted" data-testid="legend-percent">
          {{ Math.round(cat.percentage) }}%
        </span>
      </button>
    </div>
  </div>
</template>
