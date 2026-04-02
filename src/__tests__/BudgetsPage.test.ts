import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import BudgetsPage from '@/pages/BudgetsPage.vue'
import type { Budget, Category } from '@/types'

vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: vi.fn(() => ({ toPromise: vi.fn() })),
    mutation: vi.fn(() => ({ toPromise: vi.fn() })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

// ── Budgets store mock ────────────────────────────────────────
const _mockBudgets = ref<Budget[]>([])
const _mockIsLoading = ref(true)
const _mockError = ref<string | null>(null)
const _mockLoadBudgets = vi.fn(async () => { _mockIsLoading.value = false })

vi.mock('@/stores/budgets', () => ({
  useBudgetsStore: () =>
    reactive({
      get budgets() { return _mockBudgets.value },
      get isLoading() { return _mockIsLoading.value },
      get error() { return _mockError.value },
      get sortedBudgets() {
        return [..._mockBudgets.value].sort((a, b) => b.percentUsed - a.percentUsed)
      },
      get totalBudgeted() { return _mockBudgets.value.reduce((s, b) => s + b.amount, 0) },
      get totalSpent() { return _mockBudgets.value.reduce((s, b) => s + b.spent, 0) },
      get totalPercentUsed() { return 0 },
      get budgetedCategoryIds() { return new Set(_mockBudgets.value.map((b) => b.category.id)) },
      loadBudgets: _mockLoadBudgets,
      createBudget: vi.fn(),
      updateBudget: vi.fn(),
      deleteBudget: vi.fn(),
    }),
}))

// ── Categories store mock ─────────────────────────────────────
const _mockCategories = ref<Category[]>([])

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () =>
    reactive({
      get categories() { return _mockCategories.value },
      loadCategories: vi.fn(async () => {}),
    }),
}))

// ── Auth store mock ───────────────────────────────────────────
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => reactive({ defaultCurrency: 'USD' }),
}))

// ── Toast store mock ──────────────────────────────────────────
const _mockToastShow = vi.fn()

vi.mock('@/stores/toast', () => ({
  useToastStore: () => reactive({ show: _mockToastShow }),
}))

// ── Router ────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/budgets', component: BudgetsPage }],
})

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-1',
    name: '',
    month: '2026-03-01',
    amount: 200,
    spent: 80,
    remaining: 120,
    percentUsed: 40,
    category: {
      id: 'cat-1',
      name: 'Food',
      icon: '🍽️',
      color: '#FF9800',
      parentId: null,
      isDefault: false,
      sortOrder: 0,
    },
    ...overrides,
  }
}

function mountPage() {
  return mount(BudgetsPage, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
}

describe('BudgetsPage', () => {
  beforeEach(() => {
    _mockBudgets.value = []
    _mockIsLoading.value = true
    _mockError.value = null
    vi.clearAllMocks()
    _mockToastShow.mockReset()
    _mockLoadBudgets.mockImplementation(async () => { _mockIsLoading.value = false })
    document.body.innerHTML = ''
  })

  it('mounts without errors', async () => {
    _mockIsLoading.value = false
    const wrapper = mountPage()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders page title "Budgets"', async () => {
    _mockIsLoading.value = false
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Budgets')
  })

  it('shows loading skeleton while loading', () => {
    _mockIsLoading.value = true
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(true)
  })

  it('hides loading skeleton after data loads', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(false)
  })

  it('shows empty state when no budgets', async () => {
    _mockBudgets.value = []
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
  })

  it('empty state contains "No budgets set for this month."', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('No budgets set for this month.')
  })

  it('empty state has a Create Budget button', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-create-btn"]').exists()).toBe(true)
  })

  it('renders budget list when budgets are loaded', async () => {
    _mockBudgets.value = [makeBudget()]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="budget-list"]').exists()).toBe(true)
  })

  it('renders a BudgetCard for each budget', async () => {
    _mockBudgets.value = [
      makeBudget({ id: 'b1' }),
      makeBudget({ id: 'b2', category: { id: 'cat-2', name: 'Transport', icon: '🚗', color: null, parentId: null, isDefault: false, sortOrder: 1 } }),
    ]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="budget-card-b1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="budget-card-b2"]').exists()).toBe(true)
  })

  it('renders budget summary card when budgets exist', async () => {
    _mockBudgets.value = [makeBudget()]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="budget-summary-card"]').exists()).toBe(true)
  })

  it('renders Create button in header', async () => {
    _mockIsLoading.value = false
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="create-budget-btn"]').exists()).toBe(true)
  })

  it('shows error message when loading fails', async () => {
    _mockError.value = 'Failed to load budgets.'
    _mockLoadBudgets.mockImplementation(async () => { _mockIsLoading.value = false })
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Failed to load budgets.')
  })

  it('budgets are sorted worst-first (highest percentUsed first)', async () => {
    _mockBudgets.value = [
      makeBudget({ id: 'low', percentUsed: 30, category: { id: 'c1', name: 'A', icon: null, color: null, parentId: null, isDefault: false, sortOrder: 0 } }),
      makeBudget({ id: 'high', percentUsed: 95, category: { id: 'c2', name: 'B', icon: null, color: null, parentId: null, isDefault: false, sortOrder: 1 } }),
    ]
    const wrapper = mountPage()
    await flushPromises()
    const cards = wrapper.findAll('[data-testid^="budget-card-"]')
    expect(cards[0].attributes('data-testid')).toBe('budget-card-high')
    expect(cards[1].attributes('data-testid')).toBe('budget-card-low')
  })

  it('calls loadBudgets on mount', async () => {
    mountPage()
    await flushPromises()
    expect(_mockLoadBudgets).toHaveBeenCalled()
  })

  it('does NOT fire a page-level toast when the deleted event is emitted (sheet handles it)', async () => {
    // The page's onDeleted handler only clears state and invalidates; the sheet fires the toast
    _mockBudgets.value = [makeBudget()]
    const wrapper = mountPage()
    await flushPromises()
    // Simulate the edit sheet emitting 'deleted'
    const editSheet = wrapper.findComponent({ name: 'EditBudgetSheet' })
    editSheet.vm.$emit('deleted')
    await flushPromises()
    expect(_mockToastShow).not.toHaveBeenCalled()
  })
})
