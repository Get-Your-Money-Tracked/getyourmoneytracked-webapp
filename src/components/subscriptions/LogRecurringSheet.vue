<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'
import { formatCurrency } from '@/utils/currency'
import type { OverdueItem } from '@/composables/useOverdueRecurring'

const props = defineProps<{
  open: boolean
  items: OverdueItem[]
  currency: string
}>()

const emit = defineEmits<{
  close: []
  logged: [count: number, total: number]
}>()

// ── Selection state ───────────────────────────────────────────
const selectedIds = ref<Set<string>>(new Set())

// Re-initialise selection when sheet opens with new items
import { watch } from 'vue'
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      selectedIds.value = new Set(props.items.map((i) => i.subscription.id))
    }
  },
  { immediate: true },
)

const allSelected = computed(
  () => props.items.length > 0 && selectedIds.value.size === props.items.length,
)

const selectedItems = computed(() =>
  props.items.filter((i) => selectedIds.value.has(i.subscription.id)),
)

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(props.items.map((i) => i.subscription.id))
  }
}

function toggleItem(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedIds.value = next
}

// ── Totals display ────────────────────────────────────────────
const selectedTotals = computed(() => {
  let expenses = 0
  let income = 0
  let expenseCount = 0
  let incomeCount = 0
  for (const { subscription: s } of selectedItems.value) {
    if (s.type === 'INCOME') {
      income += s.amount
      incomeCount++
    } else {
      expenses += s.amount
      expenseCount++
    }
  }
  return { expenses, income, expenseCount, incomeCount }
})

// ── Due date helpers ──────────────────────────────────────────

/** Format a YYYY-MM-DD date as "Mar 1" */
function formatDueDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** "21 days ago", "1 day ago" */
function daysAgoLabel(daysOverdue: number): string {
  if (daysOverdue === 1) return '1 day ago'
  return `${daysOverdue} days ago`
}

// ── Logging ───────────────────────────────────────────────────
const isLogging = ref(false)

async function handleLog() {
  if (selectedItems.value.length === 0 || isLogging.value) return
  isLogging.value = true
  try {
    const totalLogged = selectedItems.value.reduce((sum, { subscription: s }) => sum + s.amount, 0)
    emit('logged', selectedItems.value.length, totalLogged)
    emit('close')
  } finally {
    isLogging.value = false
  }
}
</script>

<template>
  <ResponsiveSheet :open="open" title="Log Recurring Items" test-id="log-recurring-sheet" @close="$emit('close')">
    <div class="flex flex-col pb-6">
      <!-- Select All row -->
      <div class="mx-4 mb-3 flex items-center justify-between rounded-xl px-4 py-3 bg-surface-muted" data-testid="select-all-row">
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="allSelected"
            class="h-5 w-5 rounded accent-primary"
            data-testid="select-all-checkbox"
            @change="toggleAll"
          />
          <span class="text-body font-medium text-text-primary">Select All</span>
        </div>
        <span class="text-caption text-text-secondary" data-testid="item-count">
          {{ items.length }} {{ items.length === 1 ? 'item' : 'items' }}
        </span>
      </div>

      <!-- Item list -->
      <div class="mx-4 overflow-hidden rounded-xl border border-border" data-testid="items-list">
        <div
          v-for="({ subscription: s, daysOverdue }, idx) in items"
          :key="s.id"
          class="flex items-start gap-3 px-4 py-3"
          :class="idx < items.length - 1 ? 'border-b border-border' : ''"
          :data-testid="`item-row-${s.id}`"
        >
          <!-- Checkbox -->
          <input
            type="checkbox"
            :checked="selectedIds.has(s.id)"
            class="mt-0.5 h-5 w-5 rounded accent-primary shrink-0"
            :data-testid="`item-checkbox-${s.id}`"
            @change="toggleItem(s.id)"
          />

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-body font-medium text-text-primary">{{ s.name }}</p>
            <p v-if="s.nextDueDate" class="text-caption mt-0.5" style="color: var(--color-warning)">
              Due {{ formatDueDate(s.nextDueDate) }} · {{ daysAgoLabel(daysOverdue) }}
            </p>
            <p class="text-caption text-text-secondary">
              <span v-if="s.category">{{ s.category.name }} · </span>{{ s.account.name }}
            </p>
          </div>

          <!-- Amount -->
          <span
            class="text-body font-semibold tabular-nums shrink-0"
            :class="s.type === 'INCOME' ? 'text-primary' : 'text-danger'"
          >
            {{ s.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(s.amount, currency) }}
          </span>
        </div>
      </div>

      <!-- Totals -->
      <div class="mx-4 mt-3 space-y-0.5" data-testid="totals">
        <p v-if="selectedTotals.expenseCount > 0" class="text-caption text-text-secondary">
          Total: {{ formatCurrency(selectedTotals.expenses, currency) }}
          ({{ selectedTotals.expenseCount }} {{ selectedTotals.expenseCount === 1 ? 'expense' : 'expenses' }})
        </p>
        <p v-if="selectedTotals.incomeCount > 0" class="text-caption text-text-secondary">
          +{{ formatCurrency(selectedTotals.income, currency) }}
          ({{ selectedTotals.incomeCount }} {{ selectedTotals.incomeCount === 1 ? 'income' : 'income items' }})
        </p>
      </div>

      <!-- Log button -->
      <button
        type="button"
        class="mx-4 mt-4 flex h-11 w-auto items-center justify-center gap-2 rounded-xl font-medium text-body text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style="background-color: var(--color-primary)"
        :disabled="selectedItems.length === 0 || isLogging"
        data-testid="log-btn"
        @click="handleLog"
      >
        <Loader2 v-if="isLogging" :size="18" class="animate-spin" />
        {{ isLogging ? 'Logging...' : `Log Selected (${selectedItems.length})` }}
      </button>
    </div>
  </ResponsiveSheet>
</template>
