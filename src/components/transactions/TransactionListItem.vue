<script setup lang="ts">
import { computed, ref } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import type { Transaction, Account, Category } from '@/types'
import { getCurrencySymbol } from '@/utils/currency'

const props = defineProps<{
  transaction: Transaction
  accounts: Account[]
  categories: Category[]
}>()

const emit = defineEmits<{
  select: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()

const account = computed(() =>
  props.accounts.find((a) => a.id === props.transaction.accountId) ?? null,
)

const toAccount = computed(() =>
  props.transaction.toAccountId
    ? (props.accounts.find((a) => a.id === props.transaction.toAccountId) ?? null)
    : null,
)

const category = computed(() =>
  props.transaction.categoryId
    ? (props.categories.find((c) => c.id === props.transaction.categoryId) ?? null)
    : null,
)

const isTransfer = computed(() => props.transaction.type === 'TRANSFER')
const isIncome = computed(() => props.transaction.type === 'INCOME')
const isExpense = computed(() => props.transaction.type === 'EXPENSE')

const displayTitle = computed(() => {
  if (isTransfer.value) return 'Transfer'
  return props.transaction.description || category.value?.name || '—'
})

const subLine = computed(() => {
  if (isTransfer.value) {
    const from = account.value?.name ?? '?'
    const to = toAccount.value?.name ?? '?'
    return `${from} → ${to}`
  }
  const parts: string[] = []
  if (category.value) parts.push(category.value.name)
  if (account.value) parts.push(account.value.name)
  return parts.join(' · ')
})

const formattedAmount = computed(() => {
  const amount = props.transaction.amount
  const parts = amount.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formatted = parts.join('.')
  const sym = getCurrencySymbol(account.value?.currency ?? 'USD')
  if (isExpense.value) return `-${sym}${formatted}`
  if (isIncome.value) return `+${sym}${formatted}`
  return `${sym}${formatted}`
})

const amountColorClass = computed(() => {
  if (isExpense.value) return 'text-danger'
  if (isIncome.value) return 'text-primary'
  return 'text-info'
})

const dotColor = computed(() => category.value?.color ?? '#6b7280')

const iconBgColor = computed(() => {
  const color = category.value?.color ?? '#6b7280'
  return `${color}1a` // 10% opacity
})

const categoryIcon = computed(() => category.value?.icon ?? '💰')

const visibleTags = computed(() => props.transaction.tags.slice(0, 3))
const extraTagCount = computed(() =>
  Math.max(0, props.transaction.tags.length - 3),
)

// ── Swipe gesture state ──────────────────────────────────────
const SWIPE_THRESHOLD = 80
const swipeX = ref(0)
const isSwiping = ref(false)
let touchStartX = 0
let touchStartY = 0
let isHorizontalSwipe: boolean | null = null

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  isHorizontalSwipe = null
  isSwiping.value = false
}

function onTouchMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY

  // Determine swipe direction on first significant movement
  if (isHorizontalSwipe === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
    isHorizontalSwipe = Math.abs(dx) > Math.abs(dy)
  }

  if (!isHorizontalSwipe) return

  isSwiping.value = true
  // Clamp: allow swipe right (edit) and left (delete) with resistance
  const maxSwipe = SWIPE_THRESHOLD + 20
  swipeX.value = Math.max(-maxSwipe, Math.min(maxSwipe, dx))
}

function onTouchEnd() {
  if (!isSwiping.value) return

  if (swipeX.value >= SWIPE_THRESHOLD) {
    // Swiped right → edit (select)
    emit('select', props.transaction)
  } else if (swipeX.value <= -SWIPE_THRESHOLD) {
    // Swiped left → delete
    emit('delete', props.transaction)
  }

  // Animate back
  swipeX.value = 0
  isSwiping.value = false
  isHorizontalSwipe = null
}

function handleClick() {
  if (!isSwiping.value) {
    emit('select', props.transaction)
  }
}
</script>

<template>
  <div class="relative overflow-hidden">
    <!-- Background action indicators -->
    <!-- Right swipe: Edit (green) -->
    <div
      class="absolute inset-y-0 left-0 flex items-center pl-4"
      :class="swipeX > 40 ? 'text-primary' : 'text-text-muted'"
    >
      <Pencil :size="20" />
      <span v-if="swipeX > 60" class="ml-2 text-caption font-medium">Edit</span>
    </div>
    <!-- Left swipe: Delete (red) -->
    <div
      class="absolute inset-y-0 right-0 flex items-center pr-4"
      :class="swipeX < -40 ? 'text-danger' : 'text-text-muted'"
    >
      <span v-if="swipeX < -60" class="mr-2 text-caption font-medium">Delete</span>
      <Trash2 :size="20" />
    </div>

    <!-- Main content -->
    <button
      type="button"
      class="relative flex w-full items-center gap-3 bg-surface px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-muted active:bg-surface-muted active:scale-[0.98]"
      :style="{
        transform: `translateX(${swipeX}px)`,
        transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }"
      @click="handleClick"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend.passive="onTouchEnd"
    >
      <!-- Left: color dot + icon -->
      <div class="flex flex-col items-center gap-1">
        <div
          class="h-2 w-2 rounded-full"
          :style="{ backgroundColor: dotColor }"
        />
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full text-base"
          :style="{ backgroundColor: iconBgColor }"
        >
          <template v-if="isTransfer">
            <span class="text-xs text-info">↔</span>
          </template>
          <template v-else>
            {{ categoryIcon }}
          </template>
        </div>
      </div>

      <!-- Middle: title + sub-line + tags -->
      <div class="min-w-0 flex-1">
        <p class="text-card-title truncate font-medium text-text-primary">
          {{ displayTitle }}
        </p>
        <p class="text-caption truncate text-text-secondary">{{ subLine }}</p>
        <!-- Tag chips -->
        <div v-if="transaction.tags.length > 0" class="mt-1 flex flex-wrap gap-1">
          <span
            v-for="tag in visibleTags"
            :key="tag"
            class="text-badge rounded-full bg-surface-muted px-2 py-0.5 text-text-muted"
          >
            {{ tag }}
          </span>
          <span
            v-if="extraTagCount > 0"
            class="text-badge rounded-full bg-surface-muted px-2 py-0.5 text-text-muted"
          >
            +{{ extraTagCount }} more
          </span>
        </div>
      </div>

      <!-- Right: amount -->
      <div class="shrink-0 text-right">
        <span class="text-card-title font-semibold tabular-nums" :class="amountColorClass">
          {{ formattedAmount }}
        </span>
      </div>
    </button>
  </div>
</template>
