<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Home,
  CalendarClock,
  Target,
  Wallet,
  Bell,
  FolderOpen,
  Settings,
  LogOut,
  Plus,
  TrendingUp,
  Search,
  BarChart3,
  PiggyBank,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits<{
  'new-transaction': []
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { icon: Home, label: 'DEPLOY-TEST-123', path: '/dashboard' },
  { icon: CalendarClock, label: 'History', path: '/history' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Target, label: 'Budgets', path: '/budgets' },
  { icon: PiggyBank, label: 'Goals', path: '/goals' },
  { icon: Wallet, label: 'Accounts', path: '/accounts' },
  { icon: Bell, label: 'Recurring', path: '/subscriptions' },
  { icon: FolderOpen, label: 'Categories', path: '/categories' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

function isActive(path: string): boolean {
  if (path === '/history') return route.path.startsWith('/history')
  return route.path.startsWith(path)
}

const initials = computed(() => {
  const name = authStore.displayName ?? authStore.email ?? '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="fixed bottom-0 left-0 top-0 z-30 flex w-64 flex-col border-r border-border bg-surface"
    data-testid="sidebar"
  >
    <!-- Logo -->
    <div class="flex items-center px-5 pb-4 pt-6">
      <TrendingUp :size="28" class="text-primary flex-shrink-0" />
      <span class="text-card-title ml-3 font-bold text-primary">GetYourMoneyTracked</span>
    </div>

    <!-- New Transaction button -->
    <div class="mx-4 mb-6 mt-2">
      <button
        type="button"
        class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-medium text-white transition-all duration-100 hover:bg-primary-hover active:scale-[0.98]"
        data-testid="sidebar-new-transaction"
        @click="emit('new-transaction')"
      >
        <Plus :size="18" aria-hidden="true" />
        New Transaction
      </button>
    </div>

    <!-- Nav links -->
    <nav class="flex-1 space-y-1 px-3" aria-label="Sidebar navigation">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-body transition-colors duration-150"
        :class="
          isActive(item.path)
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
        "
        :data-testid="`sidebar-nav-${item.label.toLowerCase()}`"
        :aria-current="isActive(item.path) ? 'page' : undefined"
      >
        <component :is="item.icon" :size="20" aria-hidden="true" class="flex-shrink-0" />
        {{ item.label }}
      </RouterLink>
    </nav>

    <!-- User section -->
    <div class="border-t border-border p-4">
      <div class="flex items-center gap-3">
        <!-- Avatar -->
        <div
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
          aria-hidden="true"
        >
          {{ initials }}
        </div>
        <!-- Name -->
        <span class="text-caption min-w-0 flex-1 truncate font-medium text-text-primary">
          {{ authStore.displayName ?? authStore.email }}
        </span>
        <!-- Logout -->
        <button
          type="button"
          class="ml-auto flex-shrink-0 text-text-muted transition-colors duration-150 hover:text-danger"
          aria-label="Log out"
          data-testid="sidebar-logout"
          @click="handleLogout"
        >
          <LogOut :size="16" />
        </button>
      </div>
    </div>
  </aside>
</template>
