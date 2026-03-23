<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { CalendarDays } from 'lucide-vue-next'
import type { MonthlySummary } from '@/types'
import type { MonthlySortOption } from '@/graphql/queries/history'
import { fetchMonthlySummaries } from '@/graphql/queries/history'
import { useAuthStore } from '@/stores/auth'
import MonthSummaryRow from '@/components/history/MonthSummaryRow.vue'
import MonthSummarySkeletonRow from '@/components/history/MonthSummarySkeletonRow.vue'
import SortControls from '@/components/history/SortControls.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageTip from '@/components/common/PageTip.vue'

const authStore = useAuthStore()

const PAGE_SIZE = 12

const summaries = ref<MonthlySummary[]>([])
const isLoading = ref(true)
const hasMore = ref(false)
const error = ref<string | null>(null)
const sort = ref<MonthlySortOption>('CHRONOLOGICAL_DESC')
const offset = ref(0)

async function load(reset = false) {
  if (reset) {
    isLoading.value = true
    offset.value = 0
    summaries.value = []
    error.value = null
  }

  try {
    const newItems = await fetchMonthlySummaries(sort.value, PAGE_SIZE, reset ? 0 : offset.value)
    if (reset) {
      summaries.value = newItems
    } else {
      summaries.value = [...summaries.value, ...newItems]
    }
    hasMore.value = newItems.length === PAGE_SIZE
    if (!reset) {
      offset.value += PAGE_SIZE
    } else {
      offset.value = PAGE_SIZE
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load history.'
  } finally {
    isLoading.value = false
  }
}

function onSortChange(newSort: MonthlySortOption) {
  sort.value = newSort
  load(true)
}

async function loadMore() {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true
  try {
    const newItems = await fetchMonthlySummaries(sort.value, PAGE_SIZE, offset.value)
    summaries.value = [...summaries.value, ...newItems]
    hasMore.value = newItems.length === PAGE_SIZE
    offset.value += PAGE_SIZE
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load more history.'
  } finally {
    isLoading.value = false
  }
}

// Infinite scroll via IntersectionObserver on a sentinel div
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(async () => {
  await load(true)

  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )
    if (sentinel.value) {
      observer.observe(sentinel.value)
    }
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="min-h-screen pb-24">
    <!-- Header -->
    <div class="px-4 pt-6 pb-2">
      <h1 class="text-page-title font-bold text-text-primary">History</h1>
    </div>

    <!-- Page tip (new users only, dismissible) -->
    <PageTip page-key="history" />

    <!-- Sort controls -->
    <div class="px-4 mb-4" data-testid="sort-controls-wrapper">
      <SortControls :model-value="sort" @update:model-value="onSortChange" />
    </div>

    <!-- Error state -->
    <div v-if="error && !isLoading" class="px-4 py-3">
      <p class="text-body text-danger" data-testid="error-message">{{ error }}</p>
    </div>

    <!-- Loading skeleton (initial load) -->
    <div
      v-if="isLoading && summaries.length === 0"
      class="mx-4 overflow-hidden rounded-2xl bg-surface shadow-card"
      data-testid="loading-skeleton"
    >
      <div class="divide-y divide-border">
        <MonthSummarySkeletonRow v-for="n in 4" :key="n" />
      </div>
    </div>

    <!-- Month list -->
    <div
      v-else-if="summaries.length > 0"
      class="mx-4 overflow-hidden rounded-2xl bg-surface shadow-card"
      data-testid="month-list"
    >
      <div class="divide-y divide-border">
        <MonthSummaryRow
          v-for="summary in summaries"
          :key="summary.month"
          :summary="summary"
          :currency="authStore.defaultCurrency"
        />
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="!isLoading && !error"
      :icon="CalendarDays"
      title="No history yet"
      description="Your monthly summaries will appear here as you log transactions."
      data-testid="empty-state"
    />

    <!-- Loading more indicator -->
    <div v-if="isLoading && summaries.length > 0" class="py-4 text-center" data-testid="loading-more">
      <p class="text-caption text-text-muted">Loading more...</p>
    </div>

    <!-- Infinite scroll sentinel -->
    <div ref="sentinel" class="h-1" aria-hidden="true" data-testid="scroll-sentinel" />
  </div>
</template>
