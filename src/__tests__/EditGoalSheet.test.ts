import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import EditGoalSheet from '@/components/goals/EditGoalSheet.vue'
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

const _mockUpdateGoal = vi.fn()
const _mockDeleteGoal = vi.fn()

vi.mock('@/stores/goals', () => ({
  useGoalsStore: () =>
    reactive({
      updateGoal: _mockUpdateGoal,
      deleteGoal: _mockDeleteGoal,
    }),
}))

const _mockShowToast = vi.fn()
vi.mock('@/stores/toast', () => ({
  useToastStore: () =>
    reactive({
      show: _mockShowToast,
    }),
}))

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    name: 'Vacation',
    targetAmount: 2000,
    currentAmount: 500,
    targetDate: '2027-06-01',
    icon: '✈️',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function mountSheet(goal: Goal | null = makeGoal(), open = true) {
  return mount(EditGoalSheet, {
    props: { open, goal, currency: 'USD' },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('EditGoalSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  // ── Rendering ────────────────────────────────────────────────
  it('renders sheet when open is true', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render sheet when open is false', () => {
    const wrapper = mountSheet(makeGoal(), false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "Edit Goal" title', () => {
    const wrapper = mountSheet()
    expect(wrapper.text()).toContain('Edit Goal')
  })

  it('pre-fills name input', () => {
    const wrapper = mountSheet(makeGoal({ name: 'Emergency Fund' }))
    const input = wrapper.find('[data-testid="name-input"]').element as HTMLInputElement
    expect(input.value).toBe('Emergency Fund')
  })

  it('pre-fills target amount', () => {
    const wrapper = mountSheet(makeGoal({ targetAmount: 5000 }))
    const input = wrapper.find('[data-testid="target-amount-input"]').element as HTMLInputElement
    expect(input.value).toBe('5000.00')
  })

  it('pre-fills current amount', () => {
    const wrapper = mountSheet(makeGoal({ currentAmount: 250 }))
    const input = wrapper.find('[data-testid="current-amount-input"]').element as HTMLInputElement
    expect(input.value).toBe('250.00')
  })

  it('renders quick add buttons', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[data-testid="quick-add-50"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="quick-add-100"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="quick-add-500"]').exists()).toBe(true)
  })

  it('renders icon selector', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[data-testid="icon-selector"]').exists()).toBe(true)
  })

  it('renders delete button', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[data-testid="delete-goal-btn"]').exists()).toBe(true)
  })

  // ── Quick add ─────────────────────────────────────────────────
  it('increments current amount by 50 when +$50 clicked', async () => {
    const wrapper = mountSheet(makeGoal({ currentAmount: 500 }))
    await wrapper.find('[data-testid="quick-add-50"]').trigger('click')
    const input = wrapper.find('[data-testid="current-amount-input"]').element as HTMLInputElement
    expect(input.value).toBe('550.00')
  })

  it('increments current amount by 100 when +$100 clicked', async () => {
    const wrapper = mountSheet(makeGoal({ currentAmount: 500 }))
    await wrapper.find('[data-testid="quick-add-100"]').trigger('click')
    const input = wrapper.find('[data-testid="current-amount-input"]').element as HTMLInputElement
    expect(input.value).toBe('600.00')
  })

  it('increments current amount by 500 when +$500 clicked', async () => {
    const wrapper = mountSheet(makeGoal({ currentAmount: 500 }))
    await wrapper.find('[data-testid="quick-add-500"]').trigger('click')
    const input = wrapper.find('[data-testid="current-amount-input"]').element as HTMLInputElement
    expect(input.value).toBe('1000.00')
  })

  // ── Save ──────────────────────────────────────────────────────
  it('calls updateGoal on save', async () => {
    _mockUpdateGoal.mockResolvedValueOnce(makeGoal())
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="save-goal-btn"]').trigger('click')
    await flushPromises()
    expect(_mockUpdateGoal).toHaveBeenCalledWith(
      'goal-1',
      expect.objectContaining({ name: 'Vacation' }),
    )
  })

  it('emits saved and close after successful save', async () => {
    _mockUpdateGoal.mockResolvedValueOnce(makeGoal())
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="save-goal-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('saved')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows update error when save fails', async () => {
    _mockUpdateGoal.mockRejectedValueOnce(new Error('Save failed'))
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="save-goal-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="update-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Save failed')
  })

  // ── Delete ────────────────────────────────────────────────────
  it('shows delete confirmation when delete button clicked', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-goal-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="delete-confirm"]').exists()).toBe(true)
  })

  it('cancels delete confirmation when cancel clicked', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-goal-btn"]').trigger('click')
    await wrapper.find('[data-testid="cancel-delete-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="delete-confirm"]').exists()).toBe(false)
  })

  it('calls deleteGoal on confirm delete', async () => {
    _mockDeleteGoal.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-goal-btn"]').trigger('click')
    await wrapper.find('[data-testid="confirm-delete-btn"]').trigger('click')
    await flushPromises()
    expect(_mockDeleteGoal).toHaveBeenCalledWith('goal-1')
  })

  it('emits deleted and close after successful delete', async () => {
    _mockDeleteGoal.mockResolvedValueOnce(undefined)
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="delete-goal-btn"]').trigger('click')
    await wrapper.find('[data-testid="confirm-delete-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('deleted')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
