import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Transaction } from '@/types'
import {
  fetchTransactions,
  callCreateTransaction,
  callUpdateTransaction,
  callDeleteTransaction,
  type TransactionFilter,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '@/graphql/queries/transactions'

export const useTransactionsStore = defineStore('transactions', () => {
  // ── State ────────────────────────────────────────────────────
  const transactions = ref<Transaction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ── Session memory (not persisted) ───────────────────────────
  const lastUsedAccountId = ref<string | null>(null)
  const lastUsedCategoryId = ref<string | null>(null)

  // ── Actions ──────────────────────────────────────────────────

  async function loadTransactions(filter?: TransactionFilter): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const data = await fetchTransactions(filter)
      transactions.value = data
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to load transactions.'
    } finally {
      isLoading.value = false
    }
  }

  async function loadMoreTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    error.value = null
    try {
      const data = await fetchTransactions(filter)
      // Append to list (caller manages offset)
      transactions.value = [...transactions.value, ...data]
      return data
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to load transactions.'
      return []
    }
  }

  async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    error.value = null
    try {
      const newTransaction = await callCreateTransaction(input)
      // Prepend (newest first)
      transactions.value = [newTransaction, ...transactions.value]
      // Update session memory
      lastUsedAccountId.value = newTransaction.accountId
      if (newTransaction.categoryId) {
        lastUsedCategoryId.value = newTransaction.categoryId
      }
      return newTransaction
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to create transaction.'
      throw e
    }
  }

  async function updateTransaction(
    id: string,
    input: UpdateTransactionInput,
  ): Promise<Transaction> {
    error.value = null
    try {
      const updated = await callUpdateTransaction(id, input)
      transactions.value = transactions.value.map((t) => (t.id === id ? { ...t, ...updated } : t))
      return updated
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to update transaction.'
      throw e
    }
  }

  async function deleteTransaction(id: string): Promise<void> {
    error.value = null
    try {
      await callDeleteTransaction(id)
      transactions.value = transactions.value.filter((t) => t.id !== id)
    } catch (e: unknown) {
      error.value = (e as Error).message ?? 'Failed to delete transaction.'
      throw e
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    transactions,
    isLoading,
    error,
    lastUsedAccountId,
    lastUsedCategoryId,
    loadTransactions,
    loadMoreTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearError,
  }
})
