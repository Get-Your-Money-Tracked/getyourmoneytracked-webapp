<script setup lang="ts">
import { ref, watch } from 'vue'
import { CURRENCIES } from '@/utils/constants'

const props = defineProps<{
  displayName: string
  currency: string
  email: string
}>()

const emit = defineEmits<{
  save: [name: string, currency: string]
  cancel: []
}>()

const nameInput = ref(props.displayName)
const currencyInput = ref(props.currency)
const nameError = ref<string | null>(null)

// Reset form whenever the parent re-opens it with fresh values
watch(
  () => [props.displayName, props.currency],
  ([name, currency]) => {
    nameInput.value = name
    currencyInput.value = currency
    nameError.value = null
  },
)

function validate(): boolean {
  const trimmed = nameInput.value.trim()
  if (trimmed.length < 2) {
    nameError.value = 'Name must be at least 2 characters.'
    return false
  }
  if (trimmed.length > 50) {
    nameError.value = 'Name must be 50 characters or fewer.'
    return false
  }
  nameError.value = null
  return true
}

function onSave() {
  if (!validate()) return
  emit('save', nameInput.value.trim(), currencyInput.value)
}

function onCancel() {
  nameInput.value = props.displayName
  currencyInput.value = props.currency
  nameError.value = null
  emit('cancel')
}
</script>

<template>
  <div data-testid="edit-profile-form" class="mt-4 border-t border-border pt-4">
    <!-- Display name -->
    <div class="mb-3">
      <label class="text-caption mb-1 block font-medium text-text-secondary" for="edit-display-name">
        Display Name
      </label>
      <input
        id="edit-display-name"
        v-model="nameInput"
        type="text"
        maxlength="50"
        class="h-12 w-full rounded-xl border border-border bg-surface-muted px-4 text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Your name"
        data-testid="display-name-input"
        @input="nameError = null"
      />
      <p v-if="nameError" class="mt-1 text-caption text-danger" data-testid="name-error">
        {{ nameError }}
      </p>
    </div>

    <!-- Email (read-only) -->
    <div class="mb-3">
      <label class="text-caption mb-1 block font-medium text-text-secondary">Email</label>
      <p class="text-body text-text-muted" data-testid="email-readonly">{{ props.email }}</p>
    </div>

    <!-- Currency -->
    <div class="mb-4">
      <label class="text-caption mb-1 block font-medium text-text-secondary" for="edit-currency">
        Default Currency
      </label>
      <select
        id="edit-currency"
        v-model="currencyInput"
        class="h-12 w-full rounded-xl border border-border bg-surface-muted px-4 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        data-testid="currency-select"
      >
        <option
          v-for="c in CURRENCIES"
          :key="c.code"
          :value="c.code"
        >
          {{ c.code }} ({{ c.symbol }})
        </option>
      </select>
    </div>

    <!-- Actions -->
    <div class="flex gap-3">
      <button
        type="button"
        class="h-10 flex-1 rounded-xl border border-border px-4 text-body font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        data-testid="edit-profile-cancel-btn"
        @click="onCancel"
      >
        Cancel
      </button>
      <button
        type="button"
        class="h-10 flex-1 rounded-xl px-4 text-body font-medium text-white transition-opacity hover:opacity-90"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        data-testid="edit-profile-save-btn"
        @click="onSave"
      >
        Save
      </button>
    </div>
  </div>
</template>
