import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { ChartOptions } from 'chart.js'

/**
 * useChartTheme — provides reactive Chart.js options that respect the app's
 * dark/light mode. Uses CSS custom properties from main.css for consistency.
 *
 * Story 16.1 AC8: charts respect dark mode — gridlines, labels, tooltips all
 * read from design tokens.
 */
export function useChartTheme() {
  const themeStore = useThemeStore()

  /** Read a CSS variable from :root (works at runtime, not SSR) */
  function cssVar(name: string): string {
    if (typeof window === 'undefined') return ''
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }

  /**
   * Base Chart.js options shared across all chart types.
   * Re-computed whenever the theme changes so charts re-render with updated colours.
   */
  const baseOptions = computed<ChartOptions>(() => {
    // Touch isDark so Vue tracks the dependency.
    // Touch isDark so Vue tracks the dependency and re-computes on theme change.
    void themeStore.isDark

    const textSecondary = cssVar('--color-text-secondary') || (themeStore.isDark ? '#94a3b8' : '#64748b')
    const border = cssVar('--color-border') || (themeStore.isDark ? '#334155' : '#e2e8f0')
    const surface = cssVar('--color-surface') || (themeStore.isDark ? '#1e293b' : '#ffffff')
    const textPrimary = cssVar('--color-text-primary') || (themeStore.isDark ? '#f1f5f9' : '#0f172a')

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: surface,
          titleColor: textPrimary,
          bodyColor: textSecondary,
          borderColor: border,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 10,
        },
      },
      scales: {
        x: {
          grid: {
            color: `${border}4d`, // 30% opacity
            drawTicks: false,
          },
          ticks: {
            color: textSecondary,
            font: {
              family: 'Inter, sans-serif',
              size: 11,
            },
            maxRotation: 0,
          },
          border: {
            display: false,
          },
        },
        y: {
          grid: {
            color: `${border}4d`,
            drawTicks: false,
          },
          ticks: {
            color: textSecondary,
            font: {
              family: 'Inter, sans-serif',
              size: 11,
            },
          },
          border: {
            display: false,
          },
        },
      },
    }
  })

  /** Primary (income/emerald) colour */
  const primaryColor = computed(() => cssVar('--color-primary') || '#10b981')

  /** Danger (expense/red) colour */
  const dangerColor = computed(() => cssVar('--color-danger') || '#ef4444')

  /**
   * Generate a stable colour palette for category doughnut segments.
   * Falls back to a set of visually distinct hues when category colours are absent.
   */
  const categoryPalette = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
  ]

  return {
    baseOptions,
    primaryColor,
    dangerColor,
    categoryPalette,
  }
}
