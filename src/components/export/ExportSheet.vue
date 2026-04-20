<script setup lang="ts">
import { ref, computed } from 'vue'
import { Download, Loader2, Calendar, Filter } from 'lucide-vue-next'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { useToastStore } from '@/stores/toast'
import { exportTransactionsCSV } from '@/lib/export'
import ResponsiveSheet from '@/components/common/ResponsiveSheet.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()
const toastStore = useToastStore()

// ── Filter state ──────────────────────────────────────────────
const preset = ref<'30D' | '3M' | '6M' | '12M' | 'custom'>('3M')
const customStart = ref('')
const customEnd = ref('')
const selectedCategoryId = ref('')
const selectedAccountId = ref('')
const selectedType = ref<'' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('')
const isExporting = ref(false)

// ── Computed date range ───────────────────────────────────────
const dateRange = computed(() => {
  if (preset.value === 'custom') {
    return { startDate: customStart.value, endDate: customEnd.value }
  }
  const now = new Date()
  const end = formatDate(now)
  const start = new Date(now)
  switch (preset.value) {
    case '30D': start.setDate(start.getDate() - 30); break
    case '3M': start.setMonth(start.getMonth() - 3); break
    case '6M': start.setMonth(start.getMonth() - 6); break
    case '12M': start.setFullYear(start.getFullYear() - 1); break
  }
  return { startDate: formatDate(start), endDate: end }
})

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ── Export handler ────────────────────────────────────────────
async function doExport() {
  isExporting.value = true
  try {
    await exportTransactionsCSV({
      startDate: dateRange.value.startDate || undefined,
      endDate: dateRange.value.endDate || undefined,
      categoryId: selectedCategoryId.value || undefined,
      accountId: selectedAccountId.value || undefined,
      type: selectedType.value || undefined,
    })
    toastStore.show('Export downloaded', 'success')
    emit('close')
  } catch (e) {
    toastStore.show('Export failed', 'error')
  } finally {
    isExporting.value = false
  }
}

const presets = [
  { key: '30D' as const, label: '30 days' },
  { key: '3M' as const, label: '3 months' },
  { key: '6M' as const, label: '6 months' },
  { key: '12M' as const, label: '12 months' },
  { key: 'custom' as const, label: 'Custom' },
]
</script>

<template>
  <ResponsiveSheet :open="open" title="Export Transactions" test-id="export-sheet" @close="emit('close')">
    <div class="space-y-5 px-4 py-4">
      <!-- Date range presets -->
      <div>
        <label class="mb-2 flex items-center gap-1.5 text-caption font-medium text-text-secondary">
          <Calendar :size="14" />
          Date Range
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in presets"
            :key="p.key"
            type="button"
            class="rounded-lg px-3 py-1.5 text-caption font-medium transition-colors duration-150"
            :class="preset === p.key
              ? 'bg-primary text-white'
              : 'bg-surface-muted text-text-secondary hover:text-primary'"
            @click="preset = p.key"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Custom date inputs -->
        <div v-if="preset === 'custom'" class="mt-3 flex gap-3">
          <div class="flex-1">
            <label class="mb-1 block text-badge text-text-muted">From</label>
            <input
              v-model="customStart"
              type="date"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body text-text-primary outline-none focus:border-primary"
            />
          </div>
          <div class="flex-1">
            <label class="mb-1 block text-badge text-text-muted">To</label>
            <input
              v-model="customEnd"
              type="date"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body text-text-primary outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div>
        <label class="mb-2 flex items-center gap-1.5 text-caption font-medium text-text-secondary">
          <Filter :size="14" />
          Filters (optional)
        </label>
        <div class="space-y-3">
          <!-- Type -->
          <select
            v-model="selectedType"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-body text-text-primary outline-none focus:border-primary"
          >
            <option value="">All types</option>
            <option value="EXPENSE">Expenses</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfers</option>
          </select>

          <!-- Category -->
          <select
            v-model="selectedCategoryId"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-body text-text-primary outline-none focus:border-primary"
          >
            <option value="">All categories</option>
            <option
              v-for="cat in categoriesStore.categories"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>

          <!-- Account -->
          <select
            v-model="selectedAccountId"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-body text-text-primary outline-none focus:border-primary"
          >
            <option value="">All accounts</option>
            <option
              v-for="acc in accountsStore.accounts"
              :key="acc.id"
              :value="acc.id"
            >
              {{ acc.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Export button -->
      <button
        type="button"
        :disabled="isExporting"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-body font-semibold text-white transition-colors duration-150 hover:bg-primary-hover disabled:opacity-50"
        data-testid="export-btn"
        @click="doExport"
      >
        <Loader2 v-if="isExporting" :size="18" class="animate-spin" />
        <Download v-else :size="18" />
        {{ isExporting ? 'Exporting...' : 'Download CSV' }}
      </button>
    </div>
  </ResponsiveSheet>
</template>
