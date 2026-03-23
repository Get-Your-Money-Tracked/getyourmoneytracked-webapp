import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import AddGoalSheet from '@/components/goals/AddGoalSheet.vue'

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

const _mockCreateGoal = vi.fn()

vi.mock('@/stores/goals', () => ({
  useGoalsStore: () =>
    reactive({
      createGoal: _mockCreateGoal,
    }),
}))

function mountSheet(open = true) {
  return mount(AddGoalSheet, {
    props: { open, currency: 'USD' },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
}

describe('AddGoalSheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  // ── Rendering ────────────────────────────────────────────────
  it('renders sheet when open is true', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('does not render sheet when open is false', () => {
    const wrapper = mountSheet(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows "Add Goal" title', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.text()).toContain('Add Goal')
  })

  it('renders icon selector', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="icon-selector"]').exists()).toBe(true)
  })

  it('renders name input', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="name-input"]').exists()).toBe(true)
  })

  it('renders target amount input', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="target-amount-input"]').exists()).toBe(true)
  })

  it('renders current amount input', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="current-amount-input"]').exists()).toBe(true)
  })

  it('renders target date input', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="target-date-input"]').exists()).toBe(true)
  })

  it('renders 8 icon buttons', () => {
    const wrapper = mountSheet(true)
    const icons = wrapper.findAll('[data-testid^="icon-btn-"]')
    expect(icons).toHaveLength(8)
  })

  // ── Disabled state ────────────────────────────────────────────
  it('submit button is disabled when form is empty', () => {
    const wrapper = mountSheet(true)
    expect(wrapper.find('[data-testid="add-goal-submit-btn"]').attributes('disabled')).toBeDefined()
  })

  it('submit button is disabled when only name filled', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Vacation')
    expect(wrapper.find('[data-testid="add-goal-submit-btn"]').attributes('disabled')).toBeDefined()
  })

  it('submit button is enabled when name and target amount filled', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Vacation')
    await wrapper.find('[data-testid="target-amount-input"]').setValue('1000')
    expect(wrapper.find('[data-testid="add-goal-submit-btn"]').attributes('disabled')).toBeUndefined()
  })

  // ── Validation ────────────────────────────────────────────────
  it('shows name error when blurring with empty name', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').trigger('blur')
    await flushPromises()
    expect(wrapper.find('[data-testid="name-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Name is required.')
  })

  it('shows target amount error when blurring with 0', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="target-amount-input"]').setValue('0')
    await wrapper.find('[data-testid="target-amount-input"]').trigger('blur')
    await flushPromises()
    expect(wrapper.find('[data-testid="target-amount-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Target amount must be greater than 0.')
  })

  it('shows current amount error when negative value entered', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="current-amount-input"]').setValue('-5')
    await wrapper.find('[data-testid="current-amount-input"]').trigger('blur')
    await flushPromises()
    expect(wrapper.find('[data-testid="current-amount-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Current amount cannot be negative.')
  })

  // ── Icon selection ────────────────────────────────────────────
  it('selecting an icon applies selected styles', async () => {
    const wrapper = mountSheet(true)
    const iconBtn = wrapper.find('[data-testid="icon-btn-✈️"]')
    await iconBtn.trigger('click')
    expect(iconBtn.classes()).toContain('ring-2')
  })

  it('clicking the same icon again deselects it', async () => {
    const wrapper = mountSheet(true)
    const iconBtn = wrapper.find('[data-testid="icon-btn-✈️"]')
    await iconBtn.trigger('click')
    await iconBtn.trigger('click')
    expect(iconBtn.classes()).not.toContain('ring-2')
  })

  // ── Submit ────────────────────────────────────────────────────
  it('calls createGoal with correct payload', async () => {
    _mockCreateGoal.mockResolvedValueOnce({ id: 'goal-new', name: 'Vacation' })
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Vacation')
    await wrapper.find('[data-testid="target-amount-input"]').setValue('2000')
    await wrapper.find('[data-testid="add-goal-submit-btn"]').trigger('click')
    await flushPromises()
    expect(_mockCreateGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Vacation',
        targetAmount: 2000,
      }),
    )
  })

  it('emits created and close after successful creation', async () => {
    _mockCreateGoal.mockResolvedValueOnce({ id: 'goal-new' })
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Vacation')
    await wrapper.find('[data-testid="target-amount-input"]').setValue('2000')
    await wrapper.find('[data-testid="add-goal-submit-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('created')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows submit error when API call fails', async () => {
    _mockCreateGoal.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Vacation')
    await wrapper.find('[data-testid="target-amount-input"]').setValue('2000')
    await wrapper.find('[data-testid="add-goal-submit-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="submit-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Network error')
  })

  it('resets form when sheet reopens', async () => {
    const wrapper = mountSheet(true)
    await wrapper.find('[data-testid="name-input"]').setValue('Vacation')
    await wrapper.find('[data-testid="target-amount-input"]').setValue('2000')
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect((wrapper.find('[data-testid="name-input"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('[data-testid="target-amount-input"]').element as HTMLInputElement).value).toBe('')
  })
})
