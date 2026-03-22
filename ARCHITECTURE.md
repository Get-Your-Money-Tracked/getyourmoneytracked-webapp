# Architecture Guide

> A comprehensive reference for the **GetYourMoneyTracked Web App** codebase.
> Written for backend developers learning Vue — every concept is explained from scratch.
>
> Looking for setup instructions, scripts, and environment variables? See [README.md](README.md).

---

## Table of Contents

1. [How Vue Projects Are Organized](#1-how-vue-projects-are-organized)
2. [The Entry Point: `main.ts`](#2-the-entry-point-maints)
3. [Application Shell: `App.vue`](#3-application-shell-appvue)
4. [Routing: `router/index.ts`](#4-routing-routerindexts)
5. [State Management with Pinia](#5-state-management-with-pinia)
6. [The Type System: `types/index.ts`](#6-the-type-system-typesindexts)
7. [GraphQL Layer: `graphql/`](#7-graphql-layer-graphql)
8. [The urql Client: `lib/urql.ts`](#8-the-urql-client-liburlts)
9. [Firebase Authentication: `lib/firebase.ts`](#9-firebase-authentication-libfirebasets)
10. [Component Architecture](#10-component-architecture)
11. [The Design System: `assets/main.css`](#11-the-design-system-assetsmaincss)
12. [Utility Functions: `utils/`](#12-utility-functions-utils)
13. [Composables: `composables/`](#13-composables-composables)
14. [Build & Configuration](#14-build--configuration)
15. [Testing Strategy](#15-testing-strategy)
16. [Data Flow: A Complete Request Walkthrough](#16-data-flow-a-complete-request-walkthrough)
17. [UI Patterns & Conventions](#17-ui-patterns--conventions)
18. [File-by-File Reference](#18-file-by-file-reference)

---

## 1. How Vue Projects Are Organized

### Single File Components (SFCs)

Vue uses `.vue` files that combine template (HTML), script (TypeScript), and styles (CSS) into a single file:

```vue
<script setup lang="ts">
// TypeScript logic — reactive state, computed properties, functions
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>

<template>
  <!-- HTML template with Vue directives -->
  <button @click="count++">{{ doubled }}</button>
</template>

<style scoped>
/* CSS scoped to this component */
button { color: green; }
</style>
```

Key concepts for Go developers:

| Vue Concept | Go Equivalent |
|-------------|---------------|
| `<script setup>` | Like a `func init()` that runs once per component instance |
| `ref()` | Like a pointer to a value — access with `.value` in script, auto-unwrapped in template |
| `computed()` | Like a derived value that auto-recalculates when dependencies change |
| `watch()` | Like a goroutine that reacts to state changes |
| Props | Like function parameters — parent passes data down |
| Emits | Like callback functions — child notifies parent |

### The `src/` Directory

Unlike Go's `internal/` enforcement, Vue projects use `src/` by convention:

```
src/
├── assets/          → Static assets and CSS (like Go's embed files)
├── components/      → Reusable UI pieces (organized by domain)
├── composables/     → Shared reactive logic (like Go utility packages)
├── graphql/         → API queries and mutations (like Go's repository layer)
├── lib/             → Third-party library setup (like Go's cmd/ wiring)
├── pages/           → Route-level components (one per URL path)
├── router/          → URL → component mapping
├── stores/          → Global state (like Go's service layer state)
├── types/           → TypeScript interfaces (like Go's domain structs)
└── utils/           → Pure utility functions (like Go's helper packages)
```

### `package.json`

This is the Vue equivalent of Go's `go.mod`. It declares:

- **`dependencies`** — Runtime packages shipped to the browser (Vue, Pinia, urql, Firebase)
- **`devDependencies`** — Build-time only (Vite, TypeScript, Vitest, ESLint)
- **`scripts`** — Like Makefile targets (`dev`, `build`, `test`, etc.)

### Path Aliases

Instead of Go's full module import paths, Vue projects use aliases. The `@` symbol maps to `./src/`:

```ts
// Instead of: import { useAuthStore } from '../../../stores/auth'
import { useAuthStore } from '@/stores/auth'
```

This is configured in both `vite.config.ts` (for Vite) and `tsconfig.app.json` (for TypeScript).

---

## 2. The Entry Point: `main.ts`

This is where the application starts. In Vue, `main.ts` creates and configures the app instance before mounting it to the DOM. It's the equivalent of Go's `cmd/server/main.go`.

### What happens on startup (in order):

```
1.  Create the Vue app instance (createApp)
2.  Create Pinia (state management)
3.  Install plugins: Pinia → Router → urql
4.  Initialize theme store (reads localStorage / OS preference)
5.  Wire the 401 handler (urql → auth store → router redirect)
6.  Register the route guard (protect authenticated routes)
7.  Wait for Firebase onAuthStateChanged to resolve
8.  Set the user in the auth store
9.  Mount the app to #app in index.html
```

### Key design decisions:

**App doesn't mount until auth resolves**: The `onAuthStateChanged` callback fires once on page load, telling us if the user has a valid Firebase session. The app waits for this before mounting to avoid a flash of the login page for authenticated users.

```ts
const unsubscribe = onAuthStateChanged(auth, (user) => {
  authStore.setUser(user)
  unsubscribe()                    // Only need the first callback
  router.replace(router.currentRoute.value.fullPath).catch(() => {})
  app.mount('#app')                // Now mount
})
```

**Plugin install order matters**: Pinia must be installed before any store is used. The theme store is used immediately after Pinia is installed to apply the correct light/dark class before the first paint.

**Route guard**: Every navigation checks `authStore.isAuthenticated`. If the route requires auth and the user isn't logged in, they're redirected to `/login`. If an authenticated user tries to visit `/login`, they're redirected to `/dashboard`.

---

## 3. Application Shell: `App.vue`

`App.vue` is the root component — everything renders inside it. It manages the top-level layout structure.

### Layout states:

```
┌─────────────────────────────────────────────┐
│                                             │
│              AppLoader                      │  ← While auth is resolving
│         (fullscreen spinner)                │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                                             │
│           <RouterView />                    │  ← Login page (no shell)
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐    │
│  │         <RouterView />              │    │  ← Page content
│  │         (with pb-20 padding)        │    │
│  │                                     │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                        ⊕    │  ← FAB (add transaction)
│  ┌─────────────────────────────────────┐    │
│  │           BottomNav                 │    │  ← 5-tab navigation
│  └─────────────────────────────────────┘    │
│                                             │
│  AddTransactionSheet (hidden until FAB tap) │  ← Bottom sheet overlay
│  Toast (teleported to body)                 │  ← Notification system
└─────────────────────────────────────────────┘
```

The shell has three states:

1. **Loading** — `AppLoader` (fullscreen spinner) shown while Firebase auth resolves
2. **Unauthenticated** — Just `<RouterView />` (renders `LoginPage`)
3. **Authenticated** — Full shell: page content + FAB + BottomNav + AddTransactionSheet + Toast

The `isAuthRoute` computed determines which layout to render by checking both the route's `requiresAuth` meta and whether the user is actually authenticated.

---

## 4. Routing: `router/index.ts`

Vue Router maps URL paths to page components. It's the equivalent of Go's Chi router, but client-side.

### Route table:

| Path | Name | Component | Auth |
|------|------|-----------|:----:|
| `/` | — | Redirects to `/dashboard` | — |
| `/login` | `login` | `LoginPage.vue` | No |
| `/dashboard` | `dashboard` | `DashboardPage.vue` | Yes |
| `/history` | `history` | `HistoryPage.vue` | Yes |
| `/history/:month` | `monthDetail` | `MonthDetailPage.vue` | Yes |
| `/budgets` | `budgets` | `BudgetsPage.vue` | Yes |
| `/accounts` | `accounts` | `AccountsPage.vue` | Yes |
| `/categories` | `categories` | `CategoriesPage.vue` | Yes |
| `/subscriptions` | `subscriptions` | `SubscriptionsPage.vue` | Yes |
| `/settings` | `settings` | `SettingsPage.vue` | Yes |
| `/:pathMatch(.*)*` | — | Catch-all redirect to `/dashboard` | — |

### Key design decisions:

**Lazy loading**: Every page component uses dynamic `import()`, so the browser only downloads the JavaScript for the page the user is visiting:

```ts
component: () => import('@/pages/DashboardPage.vue')
```

This is like Go's `sync.Once` — the component code is loaded on first access and cached.

**History mode**: Uses `createWebHistory()` (HTML5 pushState) instead of hash-based routing. Clean URLs like `/accounts` instead of `/#/accounts`.

**Scroll behavior**: Restores scroll position on back/forward navigation, scrolls to top on new navigation.

**The route guard** is registered in `main.ts` (not in the router file) because it needs access to the Pinia auth store, which requires Pinia to be installed first.

---

## 5. State Management with Pinia

Pinia is Vue's official state management library. Think of it as a set of singleton services that hold reactive state, like Go services but with automatic UI reactivity.

### Store structure:

| Store | File | Purpose |
|-------|------|---------|
| `auth` | `stores/auth.ts` | User session, login/signup/logout, Firebase token |
| `accounts` | `stores/accounts.ts` | Account list, CRUD, balance tracking |
| `categories` | `stores/categories.ts` | Category tree, CRUD, reordering |
| `transactions` | `stores/transactions.ts` | Transaction list, CRUD, filtering |
| `budgets` | `stores/budgets.ts` | Budget list per month, CRUD, status calculation |
| `subscriptions` | `stores/subscriptions.ts` | Subscription list, CRUD, active filtering |
| `theme` | `stores/theme.ts` | Light/dark mode toggle, OS preference sync |
| `toast` | `stores/toast.ts` | Notification queue, auto-dismiss |

### Setup store pattern

This project uses Pinia's "setup" syntax (not the "options" syntax). A setup store is a function that returns reactive state and actions:

```ts
export const useAccountsStore = defineStore('accounts', () => {
  // State (like Go struct fields)
  const accounts = ref<Account[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed (like derived/calculated fields)
  const activeAccounts = computed(() =>
    accounts.value.filter(a => !a.isArchived)
  )
  const totalBalance = computed(() =>
    activeAccounts.value.reduce((sum, a) => sum + a.balance, 0)
  )

  // Actions (like Go service methods)
  async function loadAccounts() {
    isLoading.value = true
    const result = await fetchAccounts()
    accounts.value = result
    isLoading.value = false
  }

  async function createAccount(input: CreateAccountInput) {
    const account = await callCreateAccount(input)
    accounts.value.push(account)   // Optimistic: update state immediately
  }

  return { accounts, isLoading, error, activeAccounts, totalBalance,
           loadAccounts, createAccount }
})
```

### How stores connect to the backend:

```
Component (UI)
    │
    ▼
Store (Pinia)                    ← Business logic, state management
    │
    ▼
GraphQL functions (graphql/)     ← Query/mutation definitions + fetch wrappers
    │
    ▼
urql Client (lib/urql.ts)        ← HTTP transport, auth headers, error handling
    │
    ▼
Vite Proxy → Go Backend          ← /graphql → localhost:8080/graphql
```

### Important: Setup stores don't have `$reset()`

Pinia's `$reset()` only works with "options" stores. Setup stores must manually reset each ref. This is handled in the `auth.ts` logout action, which dynamically imports and resets each store:

```ts
async function logout() {
  await signOut(auth)
  user.value = null
  // Reset other stores manually
  const { useAccountsStore } = await import('./accounts')
  useAccountsStore().accounts = []
  // ... same for categories, transactions
}
```

---

## 6. The Type System: `types/index.ts`

This file contains TypeScript interfaces that mirror the backend's GraphQL schema. It's the equivalent of Go's `internal/domain/` structs.

### Core types:

```ts
// Enums (like Go's string constants)
type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER'
type AccountType = 'CASH' | 'BANK' | 'CREDIT_CARD'
type BudgetStatus = 'ON_TRACK' | 'WARNING' | 'EXCEEDED'
type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

// Domain entities (like Go's domain.Account, domain.Category, etc.)
interface Account {
  id: string
  name: string
  type: AccountType
  currency: string
  balance: number        // Parsed from GraphQL Money scalar (string → number)
  icon: string | null
  isDefault: boolean
  isArchived: boolean
}

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  date: string           // "2026-03-20" (ISO date)
  accountId: string
  categoryId: string | null
  tags: string[]         // Parsed from JSONB array
  // ...
}
```

### Key differences from Go domain types:

| Aspect | Go (`internal/domain/`) | TypeScript (`types/index.ts`) |
|--------|------------------------|-------------------------------|
| Money | `shopspring/decimal` | `number` (parsed from string) |
| IDs | `uuid.UUID` | `string` |
| Dates | `time.Time` | `string` (ISO format) |
| Nullables | Pointer (`*string`) | Union (`string \| null`) |
| Enums | `const + iota` | String literal union |

### Dashboard & aggregation types:

The type file also includes types for aggregated data returned by the backend:

- `Dashboard` — month total income/expenses, recent transactions, budget progress
- `MonthlySummary` — rollup for the history page
- `MonthDetail` — drill-down with category breakdown + pie chart data
- `BudgetProgress` — budget status with percentage and color coding
- `UpcomingBill` — subscription due dates for dashboard card

---

## 7. GraphQL Layer: `graphql/`

The GraphQL layer handles all API communication. It's organized by domain, similar to Go's repository files.

### Directory structure:

```
graphql/
├── mutations/
│   └── auth.ts            # initializeUser mutation (signup)
└── queries/
    ├── accounts.ts        # accounts query + create/update/archive mutations
    ├── budgets.ts         # budgets query + create/update/delete mutations
    ├── categories.ts      # categories query + CRUD mutations
    ├── dashboard.ts       # dashboard aggregation query
    ├── history.ts         # monthlySummaries + monthDetail queries
    ├── subscriptions.ts   # subscriptions query + CRUD mutations
    └── transactions.ts    # transactions query + CRUD mutations
```

### Anatomy of a GraphQL file:

Each file exports:
1. **Query/mutation strings** — The GraphQL operations as template literals
2. **Input types** — TypeScript interfaces for mutation variables
3. **Wrapper functions** — Async functions that execute the operation and parse the response

```ts
// 1. GraphQL query string
const ACCOUNTS_QUERY = `
  query Accounts {
    accounts {
      id name type currency balance icon isDefault isArchived
    }
  }
`

// 2. Input type (mirrors Go's model.CreateAccountInput)
export interface CreateAccountInput {
  name: string
  type: AccountType
  currency?: string
  startingBalance?: number
  icon?: string
}

// 3. Wrapper function
export async function fetchAccounts(): Promise<Account[]> {
  const client = getUrqlClient()
  const result = await client.query(ACCOUNTS_QUERY, {}).toPromise()
  if (result.error) throw result.error
  return result.data.accounts
}
```

### Why not `.graphql` files?

The project uses inline GraphQL strings (template literals in `.ts` files) instead of `.graphql` files. This avoids the need for a build-time code generation step (`@graphql-codegen/cli`) while keeping the queries co-located with their type definitions and wrapper functions.

### The `getUrqlClient()` pattern:

GraphQL files need access to the urql client, but they run outside of Vue components (where `useClient()` is available). They import the client instance directly from `lib/urql.ts`.

---

## 8. The urql Client: `lib/urql.ts`

urql is the GraphQL client — it sends queries to the backend and handles auth headers and errors. Think of it as the HTTP client layer, similar to Go's `http.Client` with middleware.

### Architecture:

```
urql Client
├── fetchOptions()          ← Injects Authorization: Bearer <token>
├── unauthorizedExchange    ← Intercepts 401 responses
└── fetchExchange           ← Actual HTTP fetch
```

### Token management:

Firebase tokens expire after 1 hour and are silently refreshed. The urql client uses a cached token pattern:

```ts
let cachedToken: string | null = null

// Updated automatically by Firebase
auth.onIdTokenChanged(async (user) => {
  cachedToken = user ? await user.getIdToken(true) : null
})

// Used on every GraphQL request
fetchOptions: () => ({
  headers: cachedToken ? { Authorization: `Bearer ${cachedToken}` } : {},
})
```

This is similar to Go's `auth.Middleware` but on the client side — every outgoing request gets the current token attached.

### 401 exchange:

The `unauthorizedExchange` uses urql's `mapExchange` to inspect every response. If the server returns a 401 (token expired, session invalid), it calls a registered callback that logs the user out and redirects to the login page:

```ts
const unauthorizedExchange: Exchange = mapExchange({
  onResult(result) {
    const status = result.error?.networkError?.statusCode
    if (status === 401 && onUnauthorizedCallback) {
      onUnauthorizedCallback()
    }
    return result
  },
})
```

The callback is wired in `main.ts`:

```ts
setOnUnauthorized(async () => {
  await authStore.logout()
  router.push({ name: 'login', query: { reason: 'session-expired' } })
})
```

### No cache exchange:

The urql client uses only `fetchExchange` (no `cacheExchange`). Every query hits the server. This is a deliberate choice — financial data must always be fresh, and Pinia stores handle local caching.

---

## 9. Firebase Authentication: `lib/firebase.ts`

Firebase Auth handles all user identity concerns. The frontend uses the Firebase JS SDK (client-side), while the Go backend uses the Firebase Admin SDK (server-side) to verify tokens.

### Setup:

```ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
```

Only Firebase Auth is used — no Firestore, Storage, or other Firebase services. The backend (PostgreSQL + Go) is the source of truth for all application data.

### Auth flow:

```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│  Vue App │     │ Firebase     │     │  Go API  │     │ Postgres │
│          │     │ Auth         │     │          │     │          │
└────┬─────┘     └──────┬───────┘     └────┬─────┘     └────┬─────┘
     │                  │                  │                 │
     │  1. Login        │                  │                 │
     │  (email/pass)    │                  │                 │
     │─────────────────>│                  │                 │
     │                  │                  │                 │
     │  2. ID Token     │                  │                 │
     │<─────────────────│                  │                 │
     │                  │                  │                 │
     │  3. onAuthStateChanged fires        │                 │
     │  authStore.setUser(user)            │                 │
     │  app.mount('#app')                  │                 │
     │                  │                  │                 │
     │  4. GraphQL requests with           │                 │
     │  Authorization: Bearer <token>      │                 │
     │────────────────────────────────────>│                 │
     │                  │                  │                 │
     │                  │  5. Verify token │                 │
     │                  │<─────────────────│                 │
     │                  │─────────────────>│                 │
     │                  │                  │                 │
     │                  │                  │  6. Query data  │
     │                  │                  │────────────────>│
     │                  │                  │<────────────────│
     │                  │                  │                 │
     │  7. Response     │                  │                 │
     │<────────────────────────────────────│                 │
```

### Auth store actions:

| Action | What it does |
|--------|--------------|
| `login(email, password)` | `signInWithEmailAndPassword()` → Firebase handles everything |
| `signup(email, password, name, currency)` | `createUserWithEmailAndPassword()` → `updateProfile()` → `callInitializeUser()` |
| `sendPasswordReset(email)` | `sendPasswordResetEmail()` → Firebase sends the email |
| `logout()` | `signOut()` → Reset user → Reset all other stores |

### Error mapping:

Firebase error codes (e.g., `auth/email-already-in-use`) are mapped to user-friendly messages in `mapFirebaseError()`:

```ts
'auth/email-already-in-use' → 'An account with this email already exists'
'auth/wrong-password'       → 'Incorrect password'
'auth/user-not-found'       → 'No account found with this email'
'auth/too-many-requests'    → 'Too many attempts. Please try again later'
```

---

## 10. Component Architecture

Components are organized by domain into subdirectories under `src/components/`.

### Directory structure:

```
components/
├── accounts/        -> Account domain UI
│   ├── AccountCard.vue
│   ├── AddAccountSheet.vue
│   ├── EditAccountSheet.vue
│   └── TotalBalanceCard.vue
│
├── budgets/         -> Budget domain UI
│   ├── BudgetCard.vue
│   ├── AddBudgetSheet.vue
│   └── EditBudgetSheet.vue
│
├── categories/      -> Category domain UI
│   ├── AddCategorySheet.vue
│   ├── CategoryListItem.vue
│   └── EditCategorySheet.vue
│
├── charts/          -> Chart components
│   └── PieChart.vue
│
├── common/          -> Shared/reusable UI primitives
│   ├── AccountSelector.vue       # Dropdown to pick an account
│   ├── AmountDisplay.vue         # Formatted currency display
│   ├── AppLoader.vue             # Fullscreen loading spinner
│   ├── CategoryChip.vue          # Colored category badge
│   ├── CategoryPicker.vue        # Grid of categories to select from
│   ├── DateSelector.vue          # Date input with calendar
│   ├── FAB.vue                   # Floating Action Button (+ icon)
│   ├── NumPad.vue                # Calculator-style number input
│   ├── PercentBadge.vue          # Percentage badge with color coding
│   ├── ProgressBar.vue           # Budget/spending progress bar
│   ├── Toast.vue                 # Notification popups (teleported)
│   └── TransactionTypeToggle.vue # EXPENSE / INCOME / TRANSFER toggle
│
├── dashboard/       -> Dashboard page components
│   ├── BudgetProgressCard.vue
│   ├── RecentTransactionsCard.vue
│   └── UpcomingBillsCard.vue
│
├── history/         -> History page components
│   ├── MonthSummaryCard.vue
│   └── CategoryBreakdownItem.vue
│
├── layout/          -> App-level layout
│   └── BottomNav.vue             # 5-tab bottom navigation bar
│
├── settings/        -> Settings page components
│   ├── UserProfileCard.vue
│   └── SettingsMenuItem.vue
│
├── subscriptions/   -> Subscription domain UI
│   ├── SubscriptionCard.vue
│   ├── AddSubscriptionSheet.vue
│   └── EditSubscriptionSheet.vue
│
└── transactions/    -> Transaction domain UI
    ├── AddTransactionSheet.vue
    ├── EditTransactionSheet.vue
    ├── TransactionFilters.vue
    ├── TransactionList.vue
    └── TransactionListItem.vue
```

### Component communication patterns:

```
Parent Component
    │
    ├── Props (down) ──────> Child Component
    │   :account="selectedAccount"
    │   :open="showSheet"
    │
    └── Events (up) <────── Child Component
        @close="showSheet = false"
        @created="handleCreated"
        @updated="handleUpdated"
```

**Props** flow data downward (parent → child). They are read-only in the child.

**Events** flow upward (child → parent). The child calls `emit('close')` and the parent handles it with `@close="handler"`.

**Stores** provide shared state across unrelated components. Any component can read and write to a Pinia store without prop drilling.

### The bottom sheet pattern:

The most critical UX pattern in the app. Add/Edit sheets for transactions, accounts, and categories all follow the same structure:

```vue
<script setup lang="ts">
// 1. Props: open (boolean), optional entity for edit mode
const props = defineProps<{ open: boolean; transaction?: Transaction }>()
const emit = defineEmits<{ close: []; created: [] }>()

// 2. Local state for the form
const amount = ref(0)
const type = ref<TransactionType>('EXPENSE')
const isDirty = ref(false)

// 3. Pre-fill from entity when editing
watch(() => props.open, (isOpen) => {
  if (isOpen && props.transaction) {
    amount.value = props.transaction.amount
    type.value = props.transaction.type
  }
}, { immediate: true })

// 4. Submit handler
async function handleSave() {
  isSubmitting.value = true
  await store.createTransaction({ amount: amount.value, type: type.value })
  toastStore.show('Transaction saved')
  emit('created')
}

// 5. Discard confirmation (edit mode only)
const showDiscardDialog = ref(false)
function handleDismiss() {
  if (isDirty.value) { showDiscardDialog.value = true }
  else { emit('close') }
}
</script>

<template>
  <DialogRoot :open="open">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <!-- NumPad, CategoryPicker, AccountSelector, etc. -->
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

### Radix Vue integration:

Radix Vue provides headless (unstyled) accessible UI primitives. The project uses:

| Radix Component | Used In | Purpose |
|----------------|---------|---------|
| `DialogRoot` / `DialogContent` | All sheets | Modal overlay with focus trap, ESC to close |
| `AlertDialogRoot` | Delete confirmations, discard dialogs | Confirmation modals |
| `SelectRoot` | AccountSelector | Dropdown selects |

These provide accessibility (ARIA attributes, keyboard navigation, focus management) out of the box. We add our own styles with Tailwind.

---

## 11. The Design System: `assets/main.css`

The design system is defined entirely in `src/assets/main.css` using CSS custom properties and Tailwind CSS 4's `@theme` directive.

### Architecture:

```
main.css
├── @import 'tailwindcss'          ← Tailwind v4 (single import)
├── @import '@fontsource/inter'    ← Inter font (400, 500, 600, 700)
├── :root { ... }                  ← Light mode CSS custom properties
├── .dark { ... }                  ← Dark mode overrides
├── @theme { ... }                 ← Expose tokens to Tailwind utilities
└── Utility classes                ← Typography, scrollbar, transitions
```

### How `@theme` works (Tailwind CSS 4):

In Tailwind v4, you extend Tailwind's utility classes by declaring tokens in the `@theme` block. This replaces the old `tailwind.config.ts` approach:

```css
@theme {
  --color-primary: var(--color-primary);
  --font-size-hero-amount: 2.25rem;
  --shadow-card: var(--shadow-card);
}
```

This creates utility classes like `bg-primary`, `text-hero-amount`, `shadow-card` that reference the CSS custom properties defined in `:root` and `.dark`.

### Color system:

| Token | Purpose | Light | Dark |
|-------|---------|-------|------|
| `--color-surface` | Page background | `#ffffff` | `#1e1e2e` |
| `--color-surface-elevated` | Card backgrounds | `#f8fafc` | `#2a2a3c` |
| `--color-surface-muted` | Disabled/muted areas | `#f1f5f9` | `#333347` |
| `--color-text-primary` | Main text | `#0f172a` | `#f1f5f9` |
| `--color-text-secondary` | Secondary text | `#64748b` | `#94a3b8` |
| `--color-text-muted` | Tertiary/disabled text | `#94a3b8` | `#64748b` |
| `--color-border` | Borders, dividers | `#e2e8f0` | `#3f3f5c` |
| `--color-primary` | Brand/action color | `#10b981` | `#10b981` |
| `--color-primary-hover` | Primary hover state | `#059669` | `#34d399` |
| `--color-danger` | Destructive actions | `#ef4444` | `#f87171` |
| `--color-warning` | Warnings, budget alerts | `#f59e0b` | `#fbbf24` |
| `--color-info` | Informational | `#3b82f6` | `#60a5fa` |

### Shadow system:

Shadows over borders is a key design principle. Four shadow levels:

| Token | Usage |
|-------|-------|
| `--shadow-card` | Cards, list items |
| `--shadow-sheet` | Bottom sheets, modals |
| `--shadow-fab` | Floating action button |
| `--shadow-dropdown` | Dropdown menus, popovers |

### Typography:

Seven size tokens with matched line heights:

```css
.text-hero-amount   { font-size: 2.25rem;   line-height: 2.5rem;   }  /* 36px — dashboard total */
.text-page-title    { font-size: 1.5rem;    line-height: 2rem;     }  /* 24px — page headings */
.text-section-title { font-size: 1.125rem;  line-height: 1.75rem;  }  /* 18px — section headings */
.text-card-title    { font-size: 1rem;      line-height: 1.5rem;   }  /* 16px — card titles */
.text-body          { font-size: 0.875rem;  line-height: 1.25rem;  }  /* 14px — body text */
.text-caption       { font-size: 0.75rem;   line-height: 1rem;     }  /* 12px — secondary info */
.text-badge         { font-size: 0.6875rem; line-height: 1rem;     }  /* 11px — badges, chips */
```

### Dark mode strategy:

Dark mode uses the CSS class strategy (not `prefers-color-scheme` media query):

1. The `theme` Pinia store manages the current mode
2. On toggle, it adds/removes the `.dark` class on `<html>`
3. The preference is persisted in `localStorage` (`gymt-theme`)
4. On first load, it checks `localStorage`, then falls back to `prefers-color-scheme`
5. An OS preference change listener keeps it in sync if no manual override exists

---

## 12. Utility Functions: `utils/`

Pure functions with no Vue dependencies. These are the equivalent of Go helper packages.

### `utils/currency.ts`

Handles all money formatting and parsing:

| Function | Purpose | Example |
|----------|---------|---------|
| `formatCurrency(amount, code)` | Format for display | `formatCurrency(1234.5, 'USD')` → `"$1,234.50"` |
| `getCurrencySymbol(code)` | Extract symbol | `getCurrencySymbol('EUR')` → `"€"` |
| `isNegativeBalance(amount)` | Check for debt | `isNegativeBalance(-150)` → `true` |
| `parseBalanceInput(value)` | Parse user input | `parseBalanceInput("1,234.56")` → `1234.56` |

Uses `Intl.NumberFormat` for locale-aware formatting with a fallback map for 20+ currencies.

### `utils/dateGrouping.ts`

Groups and formats transaction dates:

| Function | Purpose | Example |
|----------|---------|---------|
| `formatDateLabel(dateStr)` | Human-friendly label | `"2026-03-22"` → `"Today"`, `"2026-03-21"` → `"Yesterday"`, `"2026-03-18"` → `"Mar 18"` |
| `groupTransactionsByDate(txns)` | Group by date | Returns `TransactionGroup[]` with `{ label, date, transactions[] }` |

### `utils/tags.ts`

Tag parsing and validation:

| Function | Purpose | Rules |
|----------|---------|-------|
| `parseTags(input)` | Parse comma-separated string | Lowercase, spaces→hyphens, alphanumeric+hyphen+underscore only, deduplicated, max 10 tags, max 30 chars each |
| `tagsToString(tags)` | Join for display | `["food", "vacation"]` → `"food, vacation"` |
| `validateTags(tags)` | Validate array | Returns error message if > 10 tags, otherwise `null` |

---

## 13. Composables: `composables/`

Composables are reusable reactive logic functions — Vue's version of custom hooks. They use Vue's Composition API (`ref`, `computed`, etc.) and can be called from any component.

### `composables/useAuth.ts`

A thin reactive wrapper around the auth Pinia store:

```ts
export function useAuth() {
  const store = useAuthStore()
  return {
    user: computed(() => store.user),
    isAuthenticated: computed(() => store.isAuthenticated),
    displayName: computed(() => store.displayName),
    login: store.login,
    signup: store.signup,
    logout: store.logout,
    // ...
  }
}
```

This provides a cleaner component interface: `const { isAuthenticated, login } = useAuth()` instead of importing the store and accessing properties directly.

---

## 14. Build & Configuration

### `vite.config.ts`

Vite is the build tool — it's the equivalent of the Go `Makefile` + `go build`. It handles:

- **Dev server** — HMR (Hot Module Replacement) for instant browser updates
- **Production build** — Tree-shaking, minification, code splitting
- **Test runner** — Vitest is configured here as well
- **Proxy** — Dev server proxies `/graphql` to the Go backend

```ts
import { defineConfig } from 'vitest/config'   // Note: from vitest, not vite
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/graphql': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,             // No need to import describe/it/expect
    environment: 'jsdom',      // Simulated browser DOM for tests
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
```

**Important**: `defineConfig` is imported from `'vitest/config'` (not `'vite'`) because Vitest extends the Vite config type with its `test` property.

### TypeScript configuration

Uses project references (3 files):

| File | Scope | Purpose |
|------|-------|---------|
| `tsconfig.json` | Root | References the two sub-configs |
| `tsconfig.app.json` | `src/**` | App source with strict mode, `@/` alias |
| `tsconfig.node.json` | `vite.config.ts` | Build tooling config (Node.js types) |

Key strict options enabled:
- `strict: true` — Enables all strict type checks
- `noUnusedLocals: true` — Error on unused variables
- `noUnusedParameters: true` — Error on unused function params
- `noFallthroughCasesInSwitch: true` — Enforce break in switch cases

### Build pipeline:

```bash
npm run build
```

This runs two steps:
1. **`vue-tsc -b`** — TypeScript type-checking (catches type errors that Vite's esbuild skips)
2. **`vite build`** — Production bundle (tree-shaken, minified, code-split by route)

---

## 15. Testing Strategy

819 tests across 62 files using Vitest + Vue Test Utils + jsdom.

### Test organization:

All tests live in `src/__tests__/`. Each test file corresponds to a source file:

```
src/__tests__/
├── setup.ts                          # Global test setup (mocks, stubs)
├── auth.store.test.ts                # stores/auth.ts
├── categories.store.test.ts          # stores/categories.ts
├── toast.store.test.ts               # stores/toast.ts
├── currency.test.ts                  # utils/currency.ts
├── dateGrouping.test.ts              # utils/dateGrouping.ts
├── tags.test.ts                      # utils/tags.ts
├── LoginPage.test.ts                 # pages/LoginPage.vue
├── DashboardPage.test.ts             # pages/DashboardPage.vue
├── AccountsPage.test.ts             # pages/AccountsPage.vue
├── CategoriesPage.test.ts           # pages/CategoriesPage.vue
├── AccountCard.test.ts              # components/accounts/AccountCard.vue
├── AddAccountSheet.test.ts          # components/accounts/AddAccountSheet.vue
├── EditAccountSheet.test.ts         # components/accounts/EditAccountSheet.vue
├── TotalBalanceCard.test.ts         # components/accounts/TotalBalanceCard.vue
├── AddCategorySheet.test.ts         # components/categories/AddCategorySheet.vue
├── CategoryListItem.test.ts         # components/categories/CategoryListItem.vue
├── EditCategorySheet.test.ts        # components/categories/EditCategorySheet.vue
├── AddTransactionSheet.test.ts      # components/transactions/AddTransactionSheet.vue
├── EditTransactionSheet.test.ts     # components/transactions/EditTransactionSheet.vue
├── TransactionFilters.test.ts       # components/transactions/TransactionFilters.vue
├── TransactionList.test.ts          # components/transactions/TransactionList.vue
├── TransactionListItem.test.ts      # components/transactions/TransactionListItem.vue
├── AccountSelector.test.ts          # components/common/AccountSelector.vue
├── AmountDisplay.test.ts            # components/common/AmountDisplay.vue
├── CategoryPicker.test.ts           # components/common/CategoryPicker.vue
├── NumPad.test.ts                   # components/common/NumPad.vue
├── TransactionTypeToggle.test.ts    # components/common/TransactionTypeToggle.vue
├── Toast.test.ts                    # components/common/Toast.vue
├── BottomNav.test.ts                # components/layout/BottomNav.vue
├── AppLoader.routeguard.test.ts     # Route guard logic
├── urql.test.ts                     # lib/urql.ts
└── sample.test.ts                   # Sanity check
```

### The mutable store mock pattern:

This is the most important testing pattern in the codebase. Vitest ESM hoisting requires a specific approach to make store mocks mutable across tests:

```ts
import { ref, reactive } from 'vue'

// 1. Define mutable refs at module level (BEFORE vi.mock)
const _mockIsLoading = ref(false)
const _mockAccounts = ref<Account[]>([])
const _mockLoadAccounts = vi.fn()

// 2. vi.mock factory closes over the refs via a reactive object
vi.mock('@/stores/accounts', () => ({
  useAccountsStore: () =>
    reactive({
      get isLoading() { return _mockIsLoading.value },
      get accounts() { return _mockAccounts.value },
      loadAccounts: _mockLoadAccounts,
    }),
}))

// 3. Reset in beforeEach
beforeEach(() => {
  _mockIsLoading.value = false
  _mockAccounts.value = []
  _mockLoadAccounts.mockClear()
})

// 4. Mutate in individual tests
it('shows loading state', () => {
  _mockIsLoading.value = true
  const wrapper = mount(AccountsPage)
  expect(wrapper.text()).toContain('Loading')
})
```

**Why this works**: `vi.mock()` is hoisted to the top of the file by Vitest. The factory function creates a `reactive()` object with getter properties that read from the module-level `ref()` variables. When you change the ref's `.value` in a test, the reactive object's getter returns the new value, and Vue's reactivity system triggers component re-renders.

**Why `reactive()` instead of `computed()`**: If a mock store returns `computed(() => 'USD')` for a property, the template receives a `ComputedRef` object (not the string). `reactive()` with getters returns the plain value, which is what components expect from Pinia stores.

### Testing teleported components:

Components that use `<Teleport to="body">` (like `Toast.vue`) render their content into `document.body`, not inside the test wrapper. Tests must query the body directly:

```ts
it('shows toast message', async () => {
  mount(Toast)
  // NOT wrapper.find() — content is teleported
  const toast = document.body.querySelector('[role="status"]')
  expect(toast?.textContent).toContain('Success')
})

afterEach(() => {
  document.body.innerHTML = ''   // Clean up teleported content
})
```

### Testing inline style colors:

jsdom normalizes hex colors to `rgb()` in inline styles:

```ts
// This FAILS:
expect(el.style.backgroundColor).toBe('#10b981')

// This WORKS:
expect(el.style.backgroundColor).toMatch(/rgb/)
```

---

## 16. Data Flow: A Complete Request Walkthrough

Let's trace what happens when a user taps the FAB and creates a new transaction.

### Step 1: User taps the FAB

`App.vue` renders the FAB. On click, it sets `showAddTransaction = true`, which opens the `AddTransactionSheet`:

```vue
<FAB @click="showAddTransaction = true" />
<AddTransactionSheet
  :open="showAddTransaction"
  @close="showAddTransaction = false"
  @created="showAddTransaction = false"
/>
```

### Step 2: User fills out the form

Inside `AddTransactionSheet`, the user interacts with:
- `TransactionTypeToggle` → sets `type` ref to `'EXPENSE'`
- `NumPad` → sets `amount` ref to `42.50`
- `CategoryPicker` → sets `categoryId` ref to the selected category's ID
- `AccountSelector` → sets `accountId` ref to the selected account's ID
- `DateSelector` → sets `date` ref to `'2026-03-22'`

### Step 3: User taps "Save"

The component calls the transactions store:

```ts
async function handleSave() {
  isSubmitting.value = true
  await transactionsStore.createTransaction({
    type: type.value,
    amount: amount.value,
    categoryId: categoryId.value,
    accountId: accountId.value,
    date: date.value,
  })
  toastStore.show('Transaction added')
  emit('created')
}
```

### Step 4: Store calls GraphQL function

`stores/transactions.ts` calls the GraphQL wrapper:

```ts
async function createTransaction(input: CreateTransactionInput) {
  const transaction = await callCreateTransaction(input)
  transactions.value.unshift(transaction)  // Add to front of list
  lastUsedAccountId.value = input.accountId
  lastUsedCategoryId.value = input.categoryId
}
```

### Step 5: GraphQL function executes the mutation

`graphql/queries/transactions.ts` sends the mutation via urql:

```ts
export async function callCreateTransaction(input) {
  const client = urqlClient
  const result = await client.mutation(CREATE_TRANSACTION_MUTATION, { input }).toPromise()
  return result.data.createTransaction
}
```

### Step 6: urql sends the HTTP request

The urql client:
1. Reads the cached Firebase token
2. Attaches `Authorization: Bearer <token>` header
3. Sends `POST /graphql` with the mutation body
4. Vite proxy forwards to `http://localhost:8080/graphql`

### Step 7: Backend processes the request

The Go backend:
1. Chi middleware verifies the Firebase token
2. gqlgen parses the GraphQL mutation
3. Transaction resolver calls the service layer
4. Service validates input and inserts the transaction
5. Account balance is updated atomically
6. Monthly summary is updated
7. The new transaction is returned

### Step 8: Response flows back

```
Go API → JSON response
       → Vite proxy
       → urql client parses response
       → GraphQL function returns Transaction object
       → Store prepends to transactions array (reactive)
       → Component template re-renders (Vue reactivity)
       → Toast appears: "Transaction added"
       → Sheet closes (emit('created') → parent sets open=false)
```

### The complete flow:

```
User taps FAB
    │
    ▼
App.vue (showAddTransaction = true)
    │
    ▼
AddTransactionSheet opens (Radix Dialog)
    │
User fills form (NumPad, CategoryPicker, etc.)
    │
User taps "Save"
    │
    ▼
transactionsStore.createTransaction(input)
    │
    ▼
callCreateTransaction(input)  [graphql/queries/transactions.ts]
    │
    ▼
urqlClient.mutation(MUTATION, { input })  [lib/urql.ts]
    │  + Authorization: Bearer <firebase-token>
    ▼
POST /graphql  →  Vite proxy  →  localhost:8080/graphql
    │
    ▼
Go backend processes (auth → resolve → service → repo → postgres)
    │
    ▼
JSON response
    │
    ▼
urql parses → store updates → Vue re-renders → Toast → Sheet closes
```

---

## 17. UI Patterns & Conventions

### Shadows over borders

The design uses box shadows instead of borders for element separation. This creates a softer, more modern look. The four shadow levels (`card`, `sheet`, `fab`, `dropdown`) are defined as CSS tokens.

### Mobile-first

All layouts are designed for mobile viewports first. Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) are used sparingly since this is primarily a mobile web app.

### Financial number formatting

- All currency amounts use `tabular-nums` for aligned digits
- Negative balances (credit card debt) show in `text-danger`
- Zero amounts show in `text-text-muted` (signals "enter amount")
- The `NumPad` component handles decimal input with max 2 decimal places

### Color coding

| Color | Meaning |
|-------|---------|
| `primary` (emerald) | Income, positive actions, confirmations |
| `danger` (red) | Expenses, destructive actions, debt |
| `warning` (amber) | Budget warnings, approaching limits |
| `info` (blue) | Informational, links |
| `text-muted` | Disabled, placeholder, zero values |

### Category chips

`CategoryChip.vue` shows a colored dot + truncated name. Names longer than 8 characters are truncated: `slice(0, 7) + '…'`.

### Bottom sheet conventions

All sheets follow the same interaction patterns:
- Open via parent prop `open`
- Close via `@close` event
- Show loading spinner during async operations
- Show discard confirmation if form is dirty (edit mode)
- Show delete confirmation dialog (edit mode)
- Toast notification on success

### BottomNav tabs

5 tabs with Lucide icons: Dashboard (`LayoutDashboard`), History (`Clock`), FAB placeholder (center, for the floating + button), Budgets (`PiggyBank`), More (`MoreHorizontal`, opens popover with Accounts + Settings links). Active tab uses `aria-current="page"` and the primary color.

---

## 18. File-by-File Reference

### Root Files

| File | Purpose |
|------|---------|
| `index.html` | SPA entry HTML with `<div id="app">` mount point |
| `vite.config.ts` | Build tool + test runner + dev server + proxy config |
| `tsconfig.json` | TypeScript project references root |
| `tsconfig.app.json` | App source TypeScript config (strict, `@/` alias) |
| `tsconfig.node.json` | Tooling TypeScript config (Vite, Node types) |
| `package.json` | Dependencies, scripts, project metadata |
| `eslint.config.js` | ESLint config (Vue + TypeScript + Prettier) |
| `.prettierrc` | Prettier formatting config |
| `.env.example` | Environment variable template |
| `.gitignore` | Git ignore rules |

### `src/` — Application Entry

| File | Purpose |
|------|---------|
| `main.ts` | App bootstrap: plugins, auth, route guard, mount |
| `App.vue` | Root component: shell layout, FAB, BottomNav, Toast |

### `src/assets/` — Design System

| File | Purpose |
|------|---------|
| `main.css` | Tailwind config, CSS custom properties, typography, dark mode |
| `hero.png` | Login page hero image |

### `src/lib/` — Third-Party Library Setup

| File | Purpose |
|------|---------|
| `firebase.ts` | Firebase app + Auth initialization from env vars |
| `urql.ts` | GraphQL client: token caching, 401 exchange, fetch options |

### `src/router/` — Routing

| File | Purpose |
|------|---------|
| `index.ts` | Route definitions, lazy loading, scroll behavior |

### `src/types/` — TypeScript Definitions

| File | Purpose |
|------|---------|
| `index.ts` | All domain interfaces: Account, Transaction, Category, Budget, Dashboard, etc. |

### `src/stores/` — Pinia State Management

| File | Purpose |
|------|---------|
| `auth.ts` | User session, Firebase login/signup/logout, error mapping, store reset on logout |
| `accounts.ts` | Account list CRUD, balance tracking, default/archived filtering |
| `categories.ts` | Category tree CRUD, nesting, reordering, top-level/sub filtering |
| `transactions.ts` | Transaction list CRUD, filtering, last-used account/category memory |
| `budgets.ts` | Budget list per month, CRUD, status calculation (ON_TRACK/WARNING/EXCEEDED) |
| `subscriptions.ts` | Subscription list CRUD, active/inactive filtering |
| `dashboard.ts` | Dashboard state, data loading (totals, recent txns, budget progress, upcoming bills) |
| `history.ts` | Monthly summaries list, month detail with category breakdown |
| `theme.ts` | Light/dark mode toggle, localStorage persistence, OS preference sync |
| `toast.ts` | Notification queue with auto-dismiss (success/error/info variants) |

### `src/graphql/` — API Communication

| File | Purpose |
|------|---------|
| `mutations/auth.ts` | `initializeUser` mutation (called during signup) |
| `queries/accounts.ts` | Accounts query + create/update/archive mutations |
| `queries/budgets.ts` | Budgets query + create/update/delete mutations |
| `queries/categories.ts` | Categories query + CRUD + reorder mutations |
| `queries/dashboard.ts` | Dashboard aggregation query |
| `queries/history.ts` | Monthly summaries + month detail queries |
| `queries/subscriptions.ts` | Subscriptions query + CRUD mutations |
| `queries/transactions.ts` | Transactions query + CRUD mutations, filter types |

### `src/utils/` — Pure Utility Functions

| File | Purpose |
|------|---------|
| `currency.ts` | `formatCurrency()`, `getCurrencySymbol()`, `parseBalanceInput()` |
| `dateGrouping.ts` | `formatDateLabel()`, `groupTransactionsByDate()` |
| `tags.ts` | `parseTags()`, `tagsToString()`, `validateTags()` |

### `src/composables/` — Reactive Composition Functions

| File | Purpose |
|------|---------|
| `useAuth.ts` | Thin reactive wrapper around auth store for component use |

### `src/pages/` — Route-Level Components

| File | Route | Purpose |
|------|-------|---------|
| `LoginPage.vue` | `/login` | Login form, signup form, password reset |
| `DashboardPage.vue` | `/dashboard` | Hero amount, recent transactions, budget progress, upcoming bills |
| `HistoryPage.vue` | `/history` | Monthly summary list with income/expense totals |
| `MonthDetailPage.vue` | `/history/:month` | Month drill-down: pie chart, category breakdown, transactions |
| `BudgetsPage.vue` | `/budgets` | Budget list with progress bars per category |
| `AccountsPage.vue` | `/accounts` | Account cards, total balance, add/edit sheets |
| `CategoriesPage.vue` | `/categories` | Category list with drag-reorder, add/edit sheets |
| `SubscriptionsPage.vue` | `/subscriptions` | Recurring transaction management |
| `SettingsPage.vue` | `/settings` | User settings, theme toggle, logout |

### `src/components/accounts/` — Account Domain

| File | Purpose |
|------|---------|
| `AccountCard.vue` | Single account display (name, type icon, balance, currency) |
| `TotalBalanceCard.vue` | Aggregated balance across all active accounts |
| `AddAccountSheet.vue` | Bottom sheet: create account (name, type, currency, starting balance) |
| `EditAccountSheet.vue` | Bottom sheet: edit account (name, icon, default toggle, archive) |

### `src/components/budgets/` — Budget Domain

| File | Purpose |
|------|---------|
| `BudgetCard.vue` | Single budget card (category, amount, spent, progress bar, status badge) |
| `AddBudgetSheet.vue` | Bottom sheet: create budget (category, amount, month) |
| `EditBudgetSheet.vue` | Bottom sheet: edit/delete budget |

### `src/components/categories/` — Category Domain

| File | Purpose |
|------|---------|
| `CategoryListItem.vue` | Single category row (icon, color dot, name, child count, drag handle) |
| `AddCategorySheet.vue` | Bottom sheet: create category (name, icon, color, parent) |
| `EditCategorySheet.vue` | Bottom sheet: edit/delete category (with transaction guard, duplicate warning) |

### `src/components/charts/` — Chart Components

| File | Purpose |
|------|---------|
| `PieChart.vue` | Category spending breakdown pie chart (Chart.js) |

### `src/components/common/` — Shared UI Primitives

| File | Purpose |
|------|---------|
| `NumPad.vue` | Calculator-style digit input (0-9, decimal, backspace, clear) |
| `AmountDisplay.vue` | Formatted currency display with color coding (income=green, expense=red, zero=muted) |
| `TransactionTypeToggle.vue` | 3-segment toggle: EXPENSE / INCOME / TRANSFER |
| `AccountSelector.vue` | Dropdown select for choosing an account |
| `CategoryPicker.vue` | Grid of category chips for selection |
| `CategoryChip.vue` | Colored dot + truncated name badge |
| `DateSelector.vue` | Date input with native calendar picker |
| `FAB.vue` | Floating action button (emerald circle with + icon) |
| `PercentBadge.vue` | Percentage badge with color coding for budget status |
| `ProgressBar.vue` | Budget/spending progress bar with threshold color changes |
| `Toast.vue` | Notification popups (teleported to body, 3 variants, auto-dismiss) |
| `AppLoader.vue` | Fullscreen loading spinner shown during auth resolution |

### `src/components/dashboard/` — Dashboard Components

| File | Purpose |
|------|---------|
| `BudgetProgressCard.vue` | Budget progress summary for dashboard |
| `RecentTransactionsCard.vue` | Latest transactions card for dashboard |
| `UpcomingBillsCard.vue` | Upcoming subscription bills card for dashboard |

### `src/components/history/` — History Components

| File | Purpose |
|------|---------|
| `MonthSummaryCard.vue` | Monthly summary card (income, expenses, percent spent) |
| `CategoryBreakdownItem.vue` | Category spending row in month detail view |

### `src/components/layout/` — App Layout

| File | Purpose |
|------|---------|
| `BottomNav.vue` | 5-tab bottom navigation (Home, History, FAB, Budgets, More) |

### `src/components/settings/` — Settings Components

| File | Purpose |
|------|---------|
| `UserProfileCard.vue` | User avatar, name, email, currency badge |
| `SettingsMenuItem.vue` | Settings row with icon, label, and right element (toggle/arrow) |

### `src/components/subscriptions/` — Subscription Domain

| File | Purpose |
|------|---------|
| `SubscriptionCard.vue` | Single subscription card (name, amount, frequency, next due, status) |
| `AddSubscriptionSheet.vue` | Bottom sheet: create subscription |
| `EditSubscriptionSheet.vue` | Bottom sheet: edit/delete subscription |

### `src/components/transactions/` — Transaction Domain

| File | Purpose |
|------|---------|
| `TransactionListItem.vue` | Single transaction row (icon, category, amount, date, account currency) |
| `TransactionList.vue` | Date-grouped transaction list with empty state |
| `TransactionFilters.vue` | Filter bar: type, category, account, date range, search, tags |
| `AddTransactionSheet.vue` | Bottom sheet: create transaction (numpad, type, category, account, date, tags) |
| `EditTransactionSheet.vue` | Bottom sheet: edit/delete transaction (pre-filled, dirty tracking, discard confirmation) |

### `src/__tests__/` — Test Files (62 files, 819 tests)

Tests are organized to mirror the source structure. The full list includes tests for all pages, stores, components, utilities, and composables. Key test file categories:

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Pages | 9 | ~120 | All 9 page components |
| Stores | 8 | ~120 | All 8 Pinia stores |
| Account components | 4 | ~24 | Cards, sheets |
| Category components | 3 | ~25 | List items, sheets |
| Transaction components | 5 | ~58 | List, filters, sheets |
| Budget components | 3 | ~35 | Cards, sheets |
| Subscription components | 3 | ~35 | Cards, sheets |
| Dashboard components | 3 | ~25 | Progress, transactions, bills |
| History components | 2 | ~15 | Summary cards, breakdown |
| Settings components | 2 | ~15 | Profile card, menu items |
| Common components | 10 | ~65 | NumPad, selectors, pickers, FAB, Toast |
| Layout | 1 | 6 | BottomNav |
| Utilities | 3 | ~25 | Currency, dates, tags |
| GraphQL/Auth | 3 | ~15 | urql client, route guard, auth composable |
| Infrastructure | 2 | ~2 | Setup, sanity check |
