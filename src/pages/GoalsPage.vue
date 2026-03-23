<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft, Plus, PiggyBank } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import type { Goal } from '@/types'
import { useGoalsStore } from '@/stores/goals'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import GoalCard from '@/components/goals/GoalCard.vue'
import AddGoalSheet from '@/components/goals/AddGoalSheet.vue'
import EditGoalSheet from '@/components/goals/EditGoalSheet.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const goalsStore = useGoalsStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const showAddSheet = ref(false)
const selectedGoal = ref<Goal | null>(null)
const showEditSheet = ref(false)

onMounted(async () => {
  await goalsStore.loadGoals()
})

function openAdd() {
  showAddSheet.value = true
}

function onCreated() {
  toastStore.show('Goal added', 'success')
}

function openEdit(goal: Goal) {
  selectedGoal.value = goal
  showEditSheet.value = true
}

function onSaved() {
  // toast is shown inside EditGoalSheet
}

function onDeleted() {
  selectedGoal.value = null
}

function closeEdit() {
  showEditSheet.value = false
  selectedGoal.value = null
}
</script>

<template>
  <div class="min-h-screen pb-24 md:pb-0">
    <div class="mx-auto max-w-md md:max-w-4xl px-4">
      <!-- Back to Settings -->
      <div class="flex items-center gap-1 pb-1 pt-4">
        <button
          type="button"
          class="flex items-center gap-1 text-caption font-medium text-text-primary"
          data-testid="back-btn"
          @click="router.push('/settings')"
        >
          <ArrowLeft :size="20" aria-hidden="true" />
          Settings
        </button>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between pb-4 pt-2">
        <h1 class="text-page-title font-bold text-text-primary" data-testid="page-title">
          Savings Goals
        </h1>
        <button
          type="button"
          class="flex h-9 items-center gap-1.5 rounded-xl px-4 text-caption font-medium text-white transition-colors duration-150 hover:opacity-90"
          :style="{ backgroundColor: 'var(--color-primary)' }"
          data-testid="add-goal-btn"
          @click="openAdd"
        >
          <Plus :size="16" aria-hidden="true" />
          Add
        </button>
      </div>

      <!-- Loading skeleton -->
      <div
        v-if="goalsStore.isLoading"
        data-testid="loading-skeleton"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="mx-4 mt-3 rounded-xl bg-surface p-4 shadow-card"
        >
          <div class="animate-pulse">
            <div class="flex items-start gap-3">
              <div class="h-10 w-10 rounded-full bg-surface-muted" />
              <div class="flex-1">
                <div class="h-4 w-36 rounded bg-surface-muted" />
                <div class="mt-1.5 h-3 w-24 rounded bg-surface-muted" />
              </div>
            </div>
            <div class="mt-3 h-2 rounded-full bg-surface-muted" />
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="goalsStore.error" class="py-3">
        <p class="text-body text-danger" data-testid="error-message">{{ goalsStore.error }}</p>
      </div>

      <!-- Empty state -->
      <EmptyState
        v-else-if="goalsStore.goals.length === 0"
        :icon="PiggyBank"
        title="No goals yet."
        description="Set a savings goal for anything — a vacation, a new car, or an emergency fund."
        action-label="Add Goal"
        action-test-id="empty-add-btn"
        @action="openAdd"
      />

      <!-- Goal list -->
      <template v-else>
        <!-- Active goals -->
        <div v-if="goalsStore.activeGoals.length > 0">
          <div class="mt-2 flex items-center gap-2 pb-1 px-4">
            <h2 class="text-card-title font-semibold text-text-primary" data-testid="active-section-header">
              In Progress
            </h2>
            <span class="text-caption text-text-muted">({{ goalsStore.activeGoals.length }})</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2" data-testid="active-goals-list">
            <GoalCard
              v-for="goal in goalsStore.activeGoals"
              :key="goal.id"
              :goal="goal"
              :currency="authStore.defaultCurrency"
              @click="openEdit"
            />
          </div>
        </div>

        <!-- Reached goals -->
        <div v-if="goalsStore.reachedGoals.length > 0" class="mt-4">
          <div class="flex items-center gap-2 pb-1 px-4">
            <h2 class="text-card-title font-semibold text-text-primary" data-testid="reached-section-header">
              Reached
            </h2>
            <span class="text-caption text-text-muted">({{ goalsStore.reachedGoals.length }})</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2" data-testid="reached-goals-list">
            <GoalCard
              v-for="goal in goalsStore.reachedGoals"
              :key="goal.id"
              :goal="goal"
              :currency="authStore.defaultCurrency"
              @click="openEdit"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Add Goal Sheet -->
    <AddGoalSheet
      :open="showAddSheet"
      :currency="authStore.defaultCurrency"
      @close="showAddSheet = false"
      @created="onCreated"
    />

    <!-- Edit Goal Sheet -->
    <EditGoalSheet
      :open="showEditSheet"
      :goal="selectedGoal"
      :currency="authStore.defaultCurrency"
      @close="closeEdit"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </div>
</template>
