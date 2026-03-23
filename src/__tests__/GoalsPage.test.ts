import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive, ref, computed } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import GoalsPage from '@/pages/GoalsPage.vue'
import type { Goal } from '@/types'

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

// ── Child component stubs ─────────────────────────────────────
vi.mock('@/components/goals/GoalCard.vue', () => ({
  default: {
    name: 'GoalCard',
    props: ['goal', 'currency'],
    emits: ['click'],
    template: `<div data-testid="goal-card-stub" @click="$emit('click', goal)">{{ goal.name }}</div>`,
  },
}))

vi.mock('@/components/goals/AddGoalSheet.vue', () => ({
  default: {
    name: 'AddGoalSheet',
    props: ['open', 'currency'],
    emits: ['close', 'created'],
    template: `<div v-if="open" data-testid="add-goal-sheet-stub" />`,
  },
}))

vi.mock('@/components/goals/EditGoalSheet.vue', () => ({
  default: {
    name: 'EditGoalSheet',
    props: ['open', 'goal', 'currency'],
    emits: ['close', 'saved', 'deleted'],
    template: `<div v-if="open" data-testid="edit-goal-sheet-stub" />`,
  },
}))

vi.mock('@/components/common/EmptyState.vue', () => ({
  default: {
    name: 'EmptyState',
    props: ['icon', 'title', 'description', 'actionLabel', 'actionTestId'],
    emits: ['action'],
    template: `<div data-testid="empty-state-stub"><button data-testid="empty-add-btn" @click="$emit('action')">Add Goal</button></div>`,
  },
}))

// ── Store mocks ───────────────────────────────────────────────
function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    name: 'Vacation',
    targetAmount: 2000,
    currentAmount: 500,
    targetDate: null,
    icon: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const _mockLoadGoals = vi.fn()
const _mockGoals = ref<Goal[]>([])
const _mockIsLoading = ref(false)
const _mockError = ref<string | null>(null)

vi.mock('@/stores/goals', () => ({
  useGoalsStore: () =>
    reactive({
      goals: _mockGoals,
      isLoading: _mockIsLoading,
      error: _mockError,
      activeGoals: computed(() => _mockGoals.value.filter((g) => g.currentAmount < g.targetAmount)),
      reachedGoals: computed(() => _mockGoals.value.filter((g) => g.currentAmount >= g.targetAmount)),
      loadGoals: _mockLoadGoals,
    }),
}))

const _mockShowToast = vi.fn()
vi.mock('@/stores/toast', () => ({
  useToastStore: () =>
    reactive({ show: _mockShowToast }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () =>
    reactive({ defaultCurrency: 'USD', displayName: 'Test User' }),
}))

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/goals', component: GoalsPage },
      { path: '/settings', component: { template: '<div/>' } },
    ],
  })
}

async function mountPage() {
  const router = makeRouter()
  await router.push('/goals')
  await router.isReady()
  const wrapper = mount(GoalsPage, {
    global: { plugins: [createPinia(), router] },
    attachTo: document.body,
  })
  await flushPromises()
  return { wrapper, router }
}

describe('GoalsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.body.innerHTML = ''
    _mockGoals.value = []
    _mockIsLoading.value = false
    _mockError.value = null
    _mockLoadGoals.mockResolvedValue(undefined)
  })

  // ── Rendering ────────────────────────────────────────────────
  it('renders page title', async () => {
    const { wrapper } = await mountPage()
    expect(wrapper.find('[data-testid="page-title"]').text()).toBe('Savings Goals')
  })

  it('renders Add button', async () => {
    const { wrapper } = await mountPage()
    expect(wrapper.find('[data-testid="add-goal-btn"]').exists()).toBe(true)
  })

  it('calls loadGoals on mount', async () => {
    await mountPage()
    expect(_mockLoadGoals).toHaveBeenCalledOnce()
  })

  // ── Loading skeleton ──────────────────────────────────────────
  it('shows loading skeleton when isLoading is true', async () => {
    _mockIsLoading.value = true
    const { wrapper } = await mountPage()
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(true)
  })

  it('hides loading skeleton when isLoading is false', async () => {
    _mockIsLoading.value = false
    const { wrapper } = await mountPage()
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(false)
  })

  // ── Error state ──────────────────────────────────────────────
  it('shows error message when error is set', async () => {
    _mockError.value = 'Failed to load goals.'
    const { wrapper } = await mountPage()
    expect(wrapper.find('[data-testid="error-message"]').text()).toBe('Failed to load goals.')
  })

  // ── Empty state ──────────────────────────────────────────────
  it('shows empty state when goals array is empty', async () => {
    _mockGoals.value = []
    const { wrapper } = await mountPage()
    expect(wrapper.find('[data-testid="empty-state-stub"]').exists()).toBe(true)
  })

  it('hides empty state when goals exist', async () => {
    _mockGoals.value = [makeGoal()]
    const { wrapper } = await mountPage()
    expect(wrapper.find('[data-testid="empty-state-stub"]').exists()).toBe(false)
  })

  // ── Goal list ─────────────────────────────────────────────────
  it('shows active section header when there are active goals', async () => {
    _mockGoals.value = [makeGoal({ currentAmount: 500, targetAmount: 2000 })]
    const { wrapper } = await mountPage()
    expect(wrapper.find('[data-testid="active-section-header"]').exists()).toBe(true)
  })

  it('shows reached section header when there are reached goals', async () => {
    _mockGoals.value = [makeGoal({ currentAmount: 2000, targetAmount: 2000 })]
    const { wrapper } = await mountPage()
    expect(wrapper.find('[data-testid="reached-section-header"]').exists()).toBe(true)
  })

  it('renders GoalCard stubs for active goals', async () => {
    _mockGoals.value = [
      makeGoal({ id: 'g1', name: 'Vacation', currentAmount: 500, targetAmount: 2000 }),
      makeGoal({ id: 'g2', name: 'Car', currentAmount: 100, targetAmount: 5000 }),
    ]
    const { wrapper } = await mountPage()
    const cards = wrapper.findAll('[data-testid="goal-card-stub"]')
    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toContain('Vacation')
    expect(cards[1].text()).toContain('Car')
  })

  // ── Add sheet ─────────────────────────────────────────────────
  it('opens add sheet when Add button is clicked', async () => {
    const { wrapper } = await mountPage()
    await wrapper.find('[data-testid="add-goal-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="add-goal-sheet-stub"]').exists()).toBe(true)
  })

  it('opens add sheet when empty state action is clicked', async () => {
    _mockGoals.value = []
    const { wrapper } = await mountPage()
    await wrapper.find('[data-testid="empty-add-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="add-goal-sheet-stub"]').exists()).toBe(true)
  })

  it('shows toast on created event from AddGoalSheet', async () => {
    const { wrapper } = await mountPage()
    await wrapper.find('[data-testid="add-goal-btn"]').trigger('click')
    const sheet = wrapper.findComponent({ name: 'AddGoalSheet' })
    await sheet.vm.$emit('created')
    expect(_mockShowToast).toHaveBeenCalledWith('Goal added', 'success')
  })

  // ── Edit sheet ────────────────────────────────────────────────
  it('opens edit sheet when a GoalCard is clicked', async () => {
    _mockGoals.value = [makeGoal({ currentAmount: 500, targetAmount: 2000 })]
    const { wrapper } = await mountPage()
    await wrapper.find('[data-testid="goal-card-stub"]').trigger('click')
    expect(wrapper.find('[data-testid="edit-goal-sheet-stub"]').exists()).toBe(true)
  })

  // ── Back navigation ──────────────────────────────────────────
  it('renders back button', async () => {
    const { wrapper } = await mountPage()
    expect(wrapper.find('[data-testid="back-btn"]').exists()).toBe(true)
  })
})
