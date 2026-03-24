import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryBreakdownChart from '@/components/reports/CategoryBreakdownChart.vue'
import type { TrendCategorySpending } from '@/graphql/queries/reports'

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

function makeCategory(overrides: Partial<TrendCategorySpending> = {}): TrendCategorySpending {
  return {
    categoryId: 'cat-food',
    categoryName: 'Food',
    categoryColor: '#10b981',
    categoryIcon: '🍽️',
    amount: 1200,
    percentage: 37.5,
    ...overrides,
  }
}

const sampleCategories: TrendCategorySpending[] = [
  makeCategory({ categoryId: 'cat-food', categoryName: 'Food', amount: 1200, percentage: 37.5 }),
  makeCategory({ categoryId: 'cat-transport', categoryName: 'Transport', categoryColor: '#3b82f6', categoryIcon: '🚗', amount: 800, percentage: 25 }),
  makeCategory({ categoryId: 'cat-housing', categoryName: 'Housing', categoryColor: '#f59e0b', categoryIcon: '🏠', amount: 600, percentage: 18.75 }),
]

describe('CategoryBreakdownChart', () => {
  it('renders without errors', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the chart container', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    expect(wrapper.find('[data-testid="category-breakdown-chart"]').exists()).toBe(true)
  })

  it('renders the doughnut chart canvas when categories are present', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    expect(wrapper.find('[data-testid="doughnut-chart"]').exists()).toBe(true)
  })

  it('shows empty state when categories is empty', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: [] } })
    expect(wrapper.find('[data-testid="category-breakdown-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="doughnut-chart"]').exists()).toBe(false)
  })

  it('renders legend with a row per category', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    expect(wrapper.find('[data-testid="breakdown-legend-row-cat-food"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="breakdown-legend-row-cat-transport"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="breakdown-legend-row-cat-housing"]').exists()).toBe(true)
  })

  it('displays category names in the legend', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    const text = wrapper.text()
    expect(text).toContain('Food')
    expect(text).toContain('Transport')
    expect(text).toContain('Housing')
  })

  it('displays category amounts in the legend', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    const amounts = wrapper.findAll('[data-testid="breakdown-legend-amount"]')
    expect(amounts[0].text()).toContain('1,200')
    expect(amounts[1].text()).toContain('800')
    expect(amounts[2].text()).toContain('600')
  })

  it('displays category percentages in the legend', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    const percents = wrapper.findAll('[data-testid="breakdown-legend-percent"]')
    expect(percents[0].text()).toContain('38%')
    expect(percents[1].text()).toContain('25%')
    expect(percents[2].text()).toContain('19%')
  })

  it('renders color dots in the legend', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    const dots = wrapper.findAll('[data-testid="breakdown-legend-color-dot"]')
    expect(dots.length).toBe(3)
  })

  it('applies category color to color dot style', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    const dots = wrapper.findAll('[data-testid="breakdown-legend-color-dot"]')
    expect(dots[0].attributes('style')).toMatch(/background-color/)
  })

  it('renders the chart total in the center', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    const total = wrapper.find('[data-testid="chart-total"]')
    expect(total.exists()).toBe(true)
    // 1200 + 800 + 600 = 2600
    expect(total.text()).toContain('2,600')
  })

  it('highlights selected legend row when clicked', async () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    await wrapper.find('[data-testid="breakdown-legend-row-cat-food"]').trigger('click')
    expect(wrapper.find('[data-testid="breakdown-legend-row-cat-food"]').classes()).toContain('bg-primary/5')
  })

  it('deselects row when clicked again', async () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    await wrapper.find('[data-testid="breakdown-legend-row-cat-food"]').trigger('click')
    await wrapper.find('[data-testid="breakdown-legend-row-cat-food"]').trigger('click')
    expect(wrapper.find('[data-testid="breakdown-legend-row-cat-food"]').classes()).not.toContain('bg-primary/5')
  })

  it('uses fallback color when categoryColor is null', () => {
    const wrapper = mount(CategoryBreakdownChart, {
      props: { categories: [makeCategory({ categoryColor: null })] },
    })
    const dot = wrapper.find('[data-testid="breakdown-legend-color-dot"]')
    expect(dot.attributes('style')).toMatch(/background-color/)
  })

  it('renders canvas wrapper when categories are present', () => {
    const wrapper = mount(CategoryBreakdownChart, { props: { categories: sampleCategories } })
    expect(wrapper.find('[data-testid="chart-canvas-wrapper"]').exists()).toBe(true)
  })
})
