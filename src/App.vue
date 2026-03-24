<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useResponsive } from '@/composables/useResponsive'
import { invalidateDashboard } from '@/composables/useDashboardRefresh'
import AppLoader from '@/components/common/AppLoader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Toast from '@/components/common/Toast.vue'
import AddTransactionSheet from '@/components/transactions/AddTransactionSheet.vue'

const route = useRoute()
const authStore = useAuthStore()
const { isDesktop } = useResponsive()

// Show the full-screen loader while Firebase resolves auth state (prevents flash of login)
const showLoader = computed(() => authStore.isLoading)

// Only show AppShell (bottom nav + FAB) for authenticated routes that are NOT the onboarding page
const isAuthRoute = computed(
  () =>
    route.meta.requiresAuth !== false &&
    !route.meta.isOnboarding &&
    authStore.isAuthenticated,
)

// Show onboarding page without bottom nav (full-screen standalone experience)
const isOnboardingRoute = computed(
  () => route.meta.isOnboarding === true && authStore.isAuthenticated,
)

const showAddTransaction = ref(false)

function onGlobalTransactionCreated() {
  showAddTransaction.value = false
  invalidateDashboard()
}
</script>

<template>
  <!-- Full-screen loading overlay while auth state resolves -->
  <Transition name="fade">
    <AppLoader v-if="showLoader" />
  </Transition>

  <!-- App content — hidden until auth is resolved -->
  <div v-if="!showLoader" id="app-root" class="min-h-screen min-h-dvh">
    <!-- Authenticated layout -->
    <template v-if="isAuthRoute">
      <!-- Desktop: sidebar + content area -->
      <template v-if="isDesktop">
        <Sidebar @new-transaction="showAddTransaction = true" />
        <main class="ml-64 min-h-screen bg-surface-elevated" data-testid="app-shell">
          <div class="mx-auto max-w-5xl px-6 py-6">
            <RouterView />
          </div>
        </main>
      </template>

      <!-- Mobile: full-width + bottom nav -->
      <template v-else>
        <main class="pb-20" data-testid="app-shell">
          <RouterView />
        </main>
        <BottomNav @add-transaction="showAddTransaction = true" />
      </template>

      <AddTransactionSheet
        :open="showAddTransaction"
        @close="showAddTransaction = false"
        @created="onGlobalTransactionCreated"
      />
    </template>

    <!-- Onboarding layout (no BottomNav, no FAB) -->
    <template v-else-if="isOnboardingRoute">
      <main data-testid="onboarding-view">
        <RouterView />
      </main>
    </template>

    <!-- Unauthenticated layout (login page) -->
    <template v-else>
      <RouterView data-testid="unauth-view" />
    </template>
  </div>

  <!-- Toast notifications (global, always rendered) -->
  <Toast />
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
