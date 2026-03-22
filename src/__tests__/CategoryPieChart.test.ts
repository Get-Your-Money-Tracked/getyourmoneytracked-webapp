import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryPieChart from '@/components/charts/CategoryPieChart.vue'
import type { CategorySpending } from '@/types'

// Mock vue-chartjs Doughnut — Chart.js requires a canvas that jsdom doesn't support
vi.mock('vue-chartjs', () => ({
  Doughnut: {
    name: 'Doughnut',
    template: '<canvas data-testid="doughnut-chart" />',
    props: ['data', 'options'],
  },
}))

// Mock chart.js registration to be a no-op
vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  ArcElement: {},
  Tooltip: {},
  Legend: {},
}))

function makeCategory(overrides: Partial<CategorySpending> = {}): CategorySpending {
  return {
    categoryId: 'cat-food',
    categoryName: 'Food',
    categoryColor: '#10b981',
    categoryIcon: '🍽️',
    amount: 800,
    percentage: 38,
    ...overrides,
  }
}

const mockCategories: CategorySpending[] = [
  makeCategory({ categoryId: 'cat-food', categoryName: 'Food', amount: 800, percentage: 38 }),
  makeCategory({ categoryId: 'cat-transport', categoryName: 'Transport', categoryColor: '#3b82f6', categoryIcon: '🚗', amount: 450, percentage: 21 }),
  makeCategory({ categoryId: 'cat-housing', categoryName: 'Housing', categoryColor: '#f59e0b', categoryIcon: '🏠', amount: 400, percentage: 19 }),
]

function mountChart(categories = mockCategories, currency = 'USD') {
  return mount(CategoryPieChart, { props: { categories, currency } })
}

describe('CategoryPieChart', () => {
  it('renders without errors', () => {
    const wrapper = mountChart()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the doughnut chart canvas', () => {
    const wrapper = mountChart()
    expect(wrapper.find('[data-testid="doughnut-chart"]').exists()).toBe(true)
  })

  it('renders the chart total expenses', () => {
    const wrapper = mountChart()
    const total = wrapper.find('[data-testid="chart-total"]')
    expect(total.exists()).toBe(true)
    // 800 + 450 + 400 = 1650
    expect(total.text()).toContain('1,650')
  })

  it('renders the legend', () => {
    const wrapper = mountChart()
    expect(wrapper.find('[data-testid="chart-legend"]').exists()).toBe(true)
  })

  it('renders a legend row for each category', () => {
    const wrapper = mountChart()
    expect(wrapper.find('[data-testid="legend-row-cat-food"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="legend-row-cat-transport"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="legend-row-cat-housing"]').exists()).toBe(true)
  })

  it('displays category names in the legend', () => {
    const wrapper = mountChart()
    const text = wrapper.text()
    expect(text).toContain('Food')
    expect(text).toContain('Transport')
    expect(text).toContain('Housing')
  })

  it('displays category amounts in the legend', () => {
    const wrapper = mountChart()
    const amountEls = wrapper.findAll('[data-testid="legend-amount"]')
    expect(amountEls[0].text()).toContain('800')
    expect(amountEls[1].text()).toContain('450')
    expect(amountEls[2].text()).toContain('400')
  })

  it('displays category percentages in the legend', () => {
    const wrapper = mountChart()
    const percentEls = wrapper.findAll('[data-testid="legend-percent"]')
    expect(percentEls[0].text()).toContain('38%')
    expect(percentEls[1].text()).toContain('21%')
    expect(percentEls[2].text()).toContain('19%')
  })

  it('renders color dots in the legend', () => {
    const wrapper = mountChart()
    const dots = wrapper.findAll('[data-testid="legend-color-dot"]')
    expect(dots.length).toBe(3)
  })

  it('applies the category color to the color dot', () => {
    const wrapper = mountChart()
    const dots = wrapper.findAll('[data-testid="legend-color-dot"]')
    // First category has color #10b981
    expect(dots[0].attributes('style')).toMatch(/background-color/i)
  })

  it('emits filter event with categoryId when legend row is clicked', async () => {
    const wrapper = mountChart()
    await wrapper.find('[data-testid="legend-row-cat-food"]').trigger('click')
    expect(wrapper.emitted('filter')).toBeTruthy()
    expect(wrapper.emitted('filter')![0]).toEqual(['cat-food'])
  })

  it('emits filter with null when same category is clicked again (deselect)', async () => {
    const wrapper = mountChart()
    await wrapper.find('[data-testid="legend-row-cat-food"]').trigger('click')
    await wrapper.find('[data-testid="legend-row-cat-food"]').trigger('click')
    const events = wrapper.emitted('filter')!
    expect(events[0]).toEqual(['cat-food'])
    expect(events[1]).toEqual([null])
  })

  it('highlights selected legend row', async () => {
    const wrapper = mountChart()
    await wrapper.find('[data-testid="legend-row-cat-food"]').trigger('click')
    const row = wrapper.find('[data-testid="legend-row-cat-food"]')
    expect(row.classes()).toContain('bg-primary/5')
  })

  it('deselects a row when another is clicked', async () => {
    const wrapper = mountChart()
    await wrapper.find('[data-testid="legend-row-cat-food"]').trigger('click')
    await wrapper.find('[data-testid="legend-row-cat-transport"]').trigger('click')
    // Food should no longer be highlighted
    expect(wrapper.find('[data-testid="legend-row-cat-food"]').classes()).not.toContain('bg-primary/5')
    // Transport should be highlighted
    expect(wrapper.find('[data-testid="legend-row-cat-transport"]').classes()).toContain('bg-primary/5')
  })

  it('renders with empty categories without crashing', () => {
    const wrapper = mountChart([])
    expect(wrapper.find('[data-testid="chart-legend"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chart-total"]').text()).toContain('0')
  })

  it('uses a fallback color when categoryColor is null', () => {
    const wrapper = mountChart([
      makeCategory({ categoryColor: null }),
    ])
    const dot = wrapper.find('[data-testid="legend-color-dot"]')
    // Should still have a background-color style (from DEFAULT_COLORS)
    expect(dot.attributes('style')).toMatch(/background-color/i)
  })
})
