import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Account } from '@/types'
import {
  fetchAccounts,
  callCreateAccount,
  callUpdateAccount,
  callArchiveAccount,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@/graphql/queries/accounts'

export const useAccountsStore = defineStore('accounts', () => {
  // ── State ────────────────────────────────────────────────────
  const accounts = ref<Account[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ─────────────────────────────────────────────────

  /** Sum of all account balances */
  const totalBalance = computed(() =>
    accounts.value.reduce((sum, a) => sum + a.balance, 0),
  )

  /** The current default account, if any */
  const defaultAccount = computed(() =>
    accounts.value.find((a) => a.isDefault) ?? null,
  )

  // ── Actions ──────────────────────────────────────────────────

  async function loadAccounts(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const data = await fetchAccounts()
      accounts.value = data
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to load accounts.'
    } finally {
      isLoading.value = false
    }
  }

  async function createAccount(input: CreateAccountInput): Promise<Account> {
    error.value = null
    try {
      const newAccount = await callCreateAccount(input)
      // If this new account is default, unset default on all others
      if (newAccount.isDefault) {
        accounts.value = accounts.value.map((a) => ({ ...a, isDefault: false }))
      }
      accounts.value = [...accounts.value, newAccount]
      return newAccount
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to create account.'
      throw e
    }
  }

  async function updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
    error.value = null
    try {
      const updated = await callUpdateAccount(id, input)
      // If setting as default, unset others
      if (input.isDefault) {
        accounts.value = accounts.value.map((a) => ({
          ...a,
          isDefault: a.id === id ? true : false,
        }))
      }
      // Patch the updated account into the list
      accounts.value = accounts.value.map((a) => (a.id === id ? { ...a, ...updated } : a))
      return updated
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to update account.'
      throw e
    }
  }

  async function archiveAccount(id: string): Promise<void> {
    error.value = null
    try {
      await callArchiveAccount(id)
      // Backend only returns non-archived accounts, so remove from local list
      accounts.value = accounts.value.filter((a) => a.id !== id)
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to archive account.'
      throw e
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    accounts,
    isLoading,
    error,
    totalBalance,
    defaultAccount,
    loadAccounts,
    createAccount,
    updateAccount,
    archiveAccount,
    clearError,
  }
})
