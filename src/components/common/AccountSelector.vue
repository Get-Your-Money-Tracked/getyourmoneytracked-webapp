<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'
import type { Account } from '@/types'

const props = defineProps<{
  modelValue: string | null
  accounts: Account[]
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

const isOpen = ref(false)

const selectedAccount = computed(() =>
  props.accounts.find((a) => a.id === props.modelValue) ?? props.accounts[0] ?? null,
)

function selectAccount(account: Account) {
  emit('update:modelValue', account.id)
  isOpen.value = false
}

function toggleOpen() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}
</script>

<template>
  <div class="relative" @focusout="closeDropdown">
    <!-- Label above chip (for transfer mode) -->
    <p v-if="label" class="text-caption mb-1 text-text-muted">{{ label }}</p>

    <!-- Chip button -->
    <button
      type="button"
      class="flex h-10 items-center gap-2 rounded-xl bg-surface-muted px-3 text-body text-text-primary transition-colors hover:bg-surface-elevated"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="toggleOpen"
    >
      <span v-if="selectedAccount">
        <span v-if="selectedAccount.icon" class="text-base">{{ selectedAccount.icon }}</span>
        <span class="text-body font-medium">{{ selectedAccount.name }}</span>
      </span>
      <span v-else class="text-body text-text-muted">Select account</span>
      <ChevronDown :size="16" class="text-text-muted" />
    </button>

    <!-- Dropdown list -->
    <div
      v-if="isOpen"
      class="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-border bg-surface-elevated py-1"
      :style="{ boxShadow: 'var(--shadow-dropdown)' }"
      role="listbox"
    >
      <button
        v-for="account in accounts"
        :key="account.id"
        type="button"
        role="option"
        :aria-selected="account.id === modelValue"
        class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-muted"
        @click="selectAccount(account)"
      >
        <span v-if="account.icon" class="text-base">{{ account.icon }}</span>
        <span class="flex-1">
          <span class="text-body block font-medium text-text-primary">{{ account.name }}</span>
          <span class="text-caption text-text-secondary">
            {{ account.currency }}
          </span>
        </span>
        <Check v-if="account.id === modelValue" :size="16" class="text-primary" />
      </button>
    </div>
  </div>
</template>
