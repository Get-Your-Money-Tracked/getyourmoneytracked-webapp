<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  FolderOpen,
  Bell,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Wallet,
  Pencil,
  Tag,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useToastStore } from '@/stores/toast'
import EditProfileForm from '@/components/settings/EditProfileForm.vue'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const toastStore = useToastStore()

// ── Edit profile ──────────────────────────────────────────────
const showEditProfile = ref(false)
const isSavingProfile = ref(false)

function toggleEditProfile() {
  showEditProfile.value = !showEditProfile.value
}

async function handleProfileSave(name: string, currency: string) {
  isSavingProfile.value = true
  try {
    await authStore.updateProfile(name, currency)
    showEditProfile.value = false
    toastStore.show('Profile updated', 'success')
  } finally {
    isSavingProfile.value = false
  }
}

function handleProfileCancel() {
  showEditProfile.value = false
}

// ── Logout confirmation ───────────────────────────────────────
const showLogoutDialog = ref(false)
const isLoggingOut = ref(false)

function requestLogout() {
  showLogoutDialog.value = true
}

function cancelLogout() {
  showLogoutDialog.value = false
}

async function confirmLogout() {
  isLoggingOut.value = true
  try {
    await authStore.logout()
    showLogoutDialog.value = false
    router.replace('/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <!-- Logout confirmation dialog -->
  <Transition name="backdrop">
    <div
      v-if="showLogoutDialog"
      class="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-6"
      data-testid="logout-dialog-backdrop"
    >
      <div
        class="w-full max-w-sm rounded-2xl bg-surface p-6"
        :style="{ boxShadow: 'var(--shadow-sheet)' }"
        role="alertdialog"
        aria-modal="true"
        aria-label="Log out?"
        data-testid="logout-confirm-dialog"
      >
        <h3 class="text-section-title mb-2 font-semibold text-text-primary">Log out?</h3>
        <p class="text-body mb-6 text-text-secondary">
          Are you sure you want to log out of your account?
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="text-body h-11 flex-1 rounded-xl border border-border font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            data-testid="logout-cancel-btn"
            @click="cancelLogout"
          >
            Cancel
          </button>
          <button
            type="button"
            class="text-body h-11 flex-1 rounded-xl font-medium text-white transition-opacity disabled:opacity-50"
            :style="{ backgroundColor: 'var(--color-danger)' }"
            :disabled="isLoggingOut"
            data-testid="logout-confirm-btn"
            @click="confirmLogout"
          >
            {{ isLoggingOut ? 'Logging out...' : 'Log Out' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <div class="min-h-screen bg-surface-elevated">
    <div class="mx-auto max-w-md px-4 pb-28 pt-6">
      <!-- Page title -->
      <h1 class="text-page-title mb-6 font-bold text-text-primary">Settings</h1>

      <!-- User Profile Card (tappable → opens edit) -->
      <div
        class="mb-6 cursor-pointer rounded-2xl bg-surface p-5 transition-colors hover:bg-surface-muted active:scale-[0.98] active:transition-transform"
        :style="{ boxShadow: 'var(--shadow-card)' }"
        role="button"
        tabindex="0"
        data-testid="user-profile-card"
        @click="toggleEditProfile"
        @keydown.enter="toggleEditProfile"
      >
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10"
            data-testid="user-avatar"
          >
            <span class="text-sub-title font-bold text-primary" data-testid="user-initials">
              {{ authStore.initials }}
            </span>
          </div>

          <!-- Info -->
          <div class="min-w-0 flex-1">
            <p class="text-card-title font-semibold text-text-primary" data-testid="user-display-name">
              {{ authStore.displayName }}
            </p>
            <p class="mt-0.5 truncate text-caption text-text-secondary" data-testid="user-email">
              {{ authStore.email }}
            </p>
            <div class="mt-1.5">
              <span
                class="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-badge font-medium text-primary"
                data-testid="user-currency"
              >
                {{ authStore.defaultCurrency }}
              </span>
            </div>
          </div>

          <!-- Edit icon -->
          <Pencil :size="16" class="flex-shrink-0 text-text-muted" aria-hidden="true" />
        </div>

        <!-- Edit profile form (inline expansion) -->
        <Transition name="expand">
          <div v-if="showEditProfile" @click.stop>
            <EditProfileForm
              :display-name="authStore.displayName"
              :currency="authStore.defaultCurrency"
              :email="authStore.email"
              @save="handleProfileSave"
              @cancel="handleProfileCancel"
            />
          </div>
        </Transition>
      </div>

      <!-- Settings Menu -->
      <div
        class="overflow-hidden rounded-xl bg-surface"
        :style="{ boxShadow: 'var(--shadow-card)' }"
      >
        <!-- Manage Categories -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-surface-muted"
          data-testid="manage-categories-btn"
          @click="router.push('/categories')"
        >
          <FolderOpen :size="20" class="flex-shrink-0 text-text-secondary" />
          <span class="text-body flex-1 text-text-primary">Manage Categories</span>
          <ChevronRight :size="16" class="text-text-muted" />
        </button>

        <div class="border-t border-border" />

        <!-- Manage Tags -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-surface-muted"
          data-testid="manage-tags-btn"
          @click="router.push('/tags')"
        >
          <Tag :size="20" class="flex-shrink-0 text-text-secondary" />
          <span class="text-body flex-1 text-text-primary">Manage Tags</span>
          <ChevronRight :size="16" class="text-text-muted" />
        </button>

        <div class="border-t border-border" />

        <!-- Manage Accounts -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-surface-muted"
          data-testid="manage-accounts-btn"
          @click="router.push('/accounts')"
        >
          <Wallet :size="20" class="flex-shrink-0 text-text-secondary" />
          <span class="text-body flex-1 text-text-primary">Manage Accounts</span>
          <ChevronRight :size="16" class="text-text-muted" />
        </button>

        <div class="border-t border-border" />

        <!-- Manage Subscriptions -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-surface-muted"
          data-testid="manage-subscriptions-btn"
          @click="router.push('/subscriptions')"
        >
          <Bell :size="20" class="flex-shrink-0 text-text-secondary" />
          <span class="text-body flex-1 text-text-primary">Manage Subscriptions</span>
          <ChevronRight :size="16" class="text-text-muted" />
        </button>

        <div class="border-t border-border" />

        <!-- Dark Mode toggle -->
        <div class="flex items-center gap-3 px-4 py-3.5">
          <component
            :is="themeStore.isDark ? Sun : Moon"
            :size="20"
            class="flex-shrink-0 text-text-secondary"
            data-testid="theme-icon"
          />
          <span class="text-body flex-1 text-text-primary">Dark Mode</span>
          <!-- Toggle switch -->
          <button
            type="button"
            role="switch"
            :aria-checked="themeStore.isDark"
            class="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            :class="themeStore.isDark ? 'bg-primary' : 'bg-surface-muted'"
            data-testid="dark-mode-toggle"
            @click="themeStore.toggle()"
          >
            <span
              class="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
              :class="themeStore.isDark ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </button>
        </div>

        <div class="border-t border-border" />

        <!-- Log Out -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-surface-muted"
          data-testid="logout-btn"
          @click="requestLogout"
        >
          <LogOut :size="20" class="flex-shrink-0" :style="{ color: 'var(--color-danger)' }" />
          <span class="text-body flex-1 font-medium" :style="{ color: 'var(--color-danger)' }">
            Log Out
          </span>
        </button>
      </div>

      <!-- App Info Footer -->
      <div class="mt-8 pb-4 text-center" data-testid="app-footer">
        <p class="text-caption font-medium text-text-muted">GetYourMoneyTracked</p>
        <p class="mt-0.5 text-badge text-text-muted">Version 1.0.0</p>
        <a
          href="https://github.com/anomalyco/opencode/issues"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-1 inline-block text-badge font-medium text-primary underline-offset-2 hover:underline"
          data-testid="report-bug-link"
        >
          Report a bug
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.expand-enter-active { transition: opacity 0.2s ease-out, max-height 0.2s ease-out; max-height: 400px; }
.expand-leave-active { transition: opacity 0.15s ease, max-height 0.15s ease; }
.expand-enter-from { opacity: 0; max-height: 0; }
.expand-leave-to { opacity: 0; max-height: 0; }
</style>
