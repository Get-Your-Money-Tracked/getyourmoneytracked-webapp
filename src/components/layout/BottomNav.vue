<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Home,
  CalendarClock,
  Target,
  MoreHorizontal,
  Wallet,
  Settings,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

// ── Active tab detection ──────────────────────────────────────
const activeTab = computed(() => {
  const path = route.path
  if (path.startsWith('/history')) return '/history'
  if (path.startsWith('/dashboard')) return '/dashboard'
  if (path.startsWith('/budgets')) return '/budgets'
  return path
})

// ── "More" popover ────────────────────────────────────────────
const showMore = ref(false)

function toggleMore() {
  showMore.value = !showMore.value
}

function closeMore() {
  showMore.value = false
}

function navigateTo(path: string) {
  closeMore()
  router.push(path)
}
</script>

<template>
  <!-- More menu backdrop (click-away) -->
  <div
    v-if="showMore"
    class="fixed inset-0 z-30"
    aria-hidden="true"
    data-testid="more-menu-backdrop"
    @click="closeMore"
  />

  <!-- More menu popover -->
  <Transition name="more-menu">
    <div
      v-if="showMore"
      class="fixed right-2 z-40 min-w-[180px] overflow-hidden rounded-xl bg-surface py-1"
      :style="{ bottom: '68px', boxShadow: 'var(--shadow-dropdown)' }"
      role="menu"
      aria-label="More options"
      data-testid="more-menu"
    >
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-muted"
        :class="route.path.startsWith('/accounts') ? 'text-primary font-medium' : 'text-text-primary'"
        data-testid="more-accounts-btn"
        @click="navigateTo('/accounts')"
      >
        <Wallet :size="20" class="flex-shrink-0 text-text-secondary" />
        <span class="text-body">Accounts</span>
      </button>
      <div class="border-t border-border" />
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-muted"
        :class="route.path.startsWith('/settings') ? 'text-primary font-medium' : 'text-text-primary'"
        data-testid="more-settings-btn"
        @click="navigateTo('/settings')"
      >
        <Settings :size="20" class="flex-shrink-0 text-text-secondary" />
        <span class="text-body">Settings</span>
      </button>
    </div>
  </Transition>

  <!-- Bottom Navigation Bar -->
  <nav
    class="fixed inset-x-0 bottom-0 z-30 bg-surface pb-safe"
    :style="{ boxShadow: '0 -1px 3px rgba(0,0,0,0.06)' }"
    aria-label="Main navigation"
    data-testid="bottom-nav"
  >
    <div class="mx-auto flex max-w-lg items-center px-2 pt-1.5 pb-1.5">
      <!-- Home -->
      <RouterLink
        to="/dashboard"
        class="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-center transition-colors duration-150"
        :class="activeTab === '/dashboard' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'"
        :aria-current="activeTab === '/dashboard' ? 'page' : undefined"
        data-testid="nav-home"
      >
        <Home class="h-5 w-5" :stroke-width="activeTab === '/dashboard' ? 2.5 : 2" />
        <span class="text-badge font-medium leading-tight">Home</span>
      </RouterLink>

      <!-- History -->
      <RouterLink
        to="/history"
        class="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-center transition-colors duration-150"
        :class="activeTab === '/history' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'"
        :aria-current="activeTab === '/history' ? 'page' : undefined"
        data-testid="nav-history"
      >
        <CalendarClock class="h-5 w-5" :stroke-width="activeTab === '/history' ? 2.5 : 2" />
        <span class="text-badge font-medium leading-tight">History</span>
      </RouterLink>

      <!-- Center FAB placeholder (empty space) -->
      <div class="flex-1" aria-hidden="true" />

      <!-- Budgets -->
      <RouterLink
        to="/budgets"
        class="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-center transition-colors duration-150"
        :class="activeTab === '/budgets' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'"
        :aria-current="activeTab === '/budgets' ? 'page' : undefined"
        data-testid="nav-budgets"
      >
        <Target class="h-5 w-5" :stroke-width="activeTab === '/budgets' ? 2.5 : 2" />
        <span class="text-badge font-medium leading-tight">Budgets</span>
      </RouterLink>

      <!-- More -->
      <button
        type="button"
        class="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-center transition-colors duration-150"
        :class="(route.path.startsWith('/accounts') || route.path.startsWith('/settings') || showMore)
          ? 'text-primary'
          : 'text-text-muted hover:text-text-secondary'"
        :aria-expanded="showMore"
        aria-haspopup="menu"
        data-testid="nav-more"
        @click="toggleMore"
      >
        <MoreHorizontal class="h-5 w-5" :stroke-width="showMore ? 2.5 : 2" />
        <span class="text-badge font-medium leading-tight">More</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.more-menu-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.more-menu-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.more-menu-enter-from, .more-menu-leave-to { opacity: 0; transform: translateY(4px); }
</style>
