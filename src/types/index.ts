// ============================================================
// Shared TypeScript types matching the GraphQL schema
// ============================================================

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER'
export type AccountType = 'CASH' | 'BANK' | 'CREDIT_CARD'
export type BudgetStatus = 'ON_TRACK' | 'WARNING' | 'EXCEEDED'
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface User {
  id: string
  email: string
  displayName: string
  defaultCurrency: string
}

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: string
  balance: number
  icon: string | null
  isDefault: boolean
  includeInTotal: boolean
}

export interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  parentId: string | null
  isDefault: boolean
  sortOrder: number
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  date: string
  accountId: string
  toAccountId: string | null
  categoryId: string | null
  description: string | null
  notes: string | null
  tags: string[]
  receiptUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  name: string
  category: Category
  amount: number
  month: string
  spent: number
  remaining: number
  percentUsed: number
}

export interface BudgetProgress {
  budgetId: string
  categoryId: string
  categoryName: string
  categoryIcon: string | null
  limit: number
  spent: number
  remaining: number
  percentUsed: number
  status: BudgetStatus
}

export interface UpcomingBill {
  id: string
  name: string
  /** 'EXPENSE' | 'INCOME' — income items are styled in green */
  type: TransactionType
  amount: number
  currency: string
  categoryId: string | null
  accountId: string
  frequency: Frequency
  nextDueDate: string | null
  isActive: boolean
  /** When true, this item will prompt for logging when overdue */
  autoLog: boolean
}

export interface SubscriptionEntry {
  id: string
  name: string
  type: TransactionType
  amount: number
  category: Category | null
  account: Account
  frequency: Frequency
  dayOfMonth: number | null
  nextDueDate: string | null
  isActive: boolean
  autoLog: boolean
}

export interface MonthlySummary {
  month: string
  totalIncome: number
  totalExpenses: number
  percentSpent: number
}

export interface CategorySpending {
  categoryId: string | null
  categoryName: string
  categoryColor: string | null
  categoryIcon: string | null
  amount: number
  percentage: number
}

export interface MonthDetail {
  month: string
  totalIncome: number
  totalExpenses: number
  percentSpent: number
  categoryBreakdown: CategorySpending[]
  transactions: Transaction[]
  budgets: BudgetProgress[]
  subscriptions: SubscriptionEntry[]
}

export interface Dashboard {
  month: string
  totalIncome: number
  totalExpenses: number
  recurringIncome: number
  recurringExpenses: number
  remainingBudget: number
  percentSpent: number
  recentTransactions: Transaction[]
  upcomingBills: UpcomingBill[]
  budgetProgress: BudgetProgress[]
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  icon: string | null
  createdAt: string
}
