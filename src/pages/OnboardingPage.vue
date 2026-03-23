<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { ONBOARDING_COMPLETED_KEY } from '@/utils/constants'
import StepIndicator from '@/components/onboarding/StepIndicator.vue'
import OnboardingStep1 from '@/components/onboarding/OnboardingStep1.vue'
import OnboardingStep2 from '@/components/onboarding/OnboardingStep2.vue'
import OnboardingStep3 from '@/components/onboarding/OnboardingStep3.vue'

const router = useRouter()
const authStore = useAuthStore()
const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()

const TOTAL_STEPS = 3
const currentStep = ref(0)
/** -1 = sliding right (backward), 1 = sliding left (forward) */
const slideDirection = ref<1 | -1>(1)

onMounted(async () => {
  // Pre-load data needed for Step 2
  await Promise.all([
    accountsStore.accounts.length === 0 ? accountsStore.loadAccounts() : Promise.resolve(),
    categoriesStore.categories.length === 0 ? categoriesStore.loadCategories() : Promise.resolve(),
  ])
})

function completeOnboarding() {
  try {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
  } catch {
    // localStorage unavailable — proceed anyway
  }
}

function skip() {
  completeOnboarding()
  router.replace({ name: 'dashboard' })
}

function next() {
  if (currentStep.value < TOTAL_STEPS - 1) {
    slideDirection.value = 1
    currentStep.value++
  }
}

function back() {
  if (currentStep.value > 0) {
    slideDirection.value = -1
    currentStep.value--
  }
}

function logFirstTransaction() {
  completeOnboarding()
  router.replace({ name: 'dashboard', query: { action: 'add-transaction' } })
}
</script>

<template>
  <div class="flex min-h-screen min-h-dvh flex-col bg-surface-elevated" data-testid="onboarding-page">
    <!-- Skip link -->
    <div class="flex justify-end px-4 pt-4">
      <button
        type="button"
        class="text-caption font-medium text-text-muted transition-colors hover:text-text-secondary"
        data-testid="skip-btn"
        @click="skip"
      >
        Skip →
      </button>
    </div>

    <!-- Step content area -->
    <div class="flex-1 overflow-hidden">
      <Transition
        :name="slideDirection === 1 ? 'slide-left' : 'slide-right'"
        mode="out-in"
      >
        <div :key="currentStep" class="mx-auto max-w-sm">
          <OnboardingStep1
            v-if="currentStep === 0"
            :display-name="authStore.displayName"
          />
          <OnboardingStep2 v-else-if="currentStep === 1" />
          <OnboardingStep3
            v-else
            @log-transaction="logFirstTransaction"
          />
        </div>
      </Transition>
    </div>

    <!-- Bottom controls -->
    <div class="px-6 pb-10 pt-4">
      <!-- Progress dots -->
      <StepIndicator :total="TOTAL_STEPS" :current="currentStep" />

      <!-- Next / Get Started button -->
      <button
        v-if="currentStep < TOTAL_STEPS - 1"
        type="button"
        class="mt-6 h-12 w-full rounded-xl font-medium text-white"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        data-testid="next-btn"
        @click="next"
      >
        Next
      </button>

      <!-- Back link -->
      <button
        v-if="currentStep > 0"
        type="button"
        class="mt-3 block w-full text-center text-caption text-text-secondary transition-colors hover:text-text-primary"
        data-testid="back-btn"
        @click="back"
      >
        ← Back
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Slide left (forward) */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.2s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
