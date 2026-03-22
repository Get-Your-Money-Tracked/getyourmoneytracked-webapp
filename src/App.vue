<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLoader from '@/components/common/AppLoader.vue'
import FAB from '@/components/common/FAB.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import Toast from '@/components/common/Toast.vue'
import AddTransactionSheet from '@/components/transactions/AddTransactionSheet.vue'

const route = useRoute()
const authStore = useAuthStore()

// Show the full-screen loader while Firebase resolves auth state (prevents flash of login)
const showLoader = computed(() => authStore.isLoading)

// Only show AppShell (bottom nav + FAB) for authenticated routes
const isAuthRoute = computed(
  () => route.meta.requiresAuth !== false && authStore.isAuthenticated,
)

const showAddTransaction = ref(false)
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
      <main class="pb-20" data-testid="app-shell">
        <RouterView />
      </main>
      <FAB data-testid="fab" @click="showAddTransaction = true" />
      <BottomNav />
      <AddTransactionSheet
        :open="showAddTransaction"
        @close="showAddTransaction = false"
        @created="showAddTransaction = false"
      />
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
