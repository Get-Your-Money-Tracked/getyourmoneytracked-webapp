# GetYourMoneyTracked Web App

Frontend SPA for **GetYourMoneyTracked** — a personal finance application that helps users track income, expenses, transfers, budgets, and subscriptions with a "Safe to Spend" philosophy.

Built with Vue 3, TypeScript, Tailwind CSS 4, and GraphQL (urql).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3.5 (Composition API + `<script setup>`) |
| Language | TypeScript 5.9 (strict mode) |
| Build Tool | [Vite](https://vite.dev) 8 |
| Styling | [Tailwind CSS](https://tailwindcss.com) 4 via `@tailwindcss/vite` |
| UI Primitives | [Radix Vue](https://radix-vue.com) 1.9 (headless, accessible) |
| Icons | [Lucide Vue Next](https://lucide.dev) |
| State Management | [Pinia](https://pinia.vuejs.org) 3 |
| Routing | [Vue Router](https://router.vuejs.org) 5 |
| GraphQL Client | [@urql/vue](https://commerce.nearform.com/open-source/urql/) 2 |
| Charts | [Chart.js](https://www.chartjs.org) 4 + [vue-chartjs](https://vue-chartjs.org) 5 |
| Auth | [Firebase JS SDK](https://firebase.google.com/docs/web/setup) 12 |
| Utilities | [VueUse](https://vueuse.org) 14 |
| Testing | [Vitest](https://vitest.dev) 4 + [Vue Test Utils](https://test-utils.vuejs.org) 2 |
| Font | [Inter](https://rsms.me/inter/) via `@fontsource/inter` |

---

## Getting Started

### Prerequisites

- **Node.js 20+** — [download](https://nodejs.org)
- **Backend API running** — see [getyourmoneytracked-api](https://github.com/Get-Your-Money-Tracked/getyourmoneytracked-api) README
- **Firebase project** — [console](https://console.firebase.google.com)

### 1. Clone & configure

```bash
git clone https://github.com/Get-Your-Money-Tracked/getyourmoneytracked-webapp.git
cd getyourmoneytracked-webapp
cp .env.example .env
# Edit .env with your Firebase project values
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the dev server

```bash
npm run dev     # Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/graphql` requests to `http://localhost:8080` (the Go backend). Make sure the backend is running.

### 4. Run tests

```bash
npm test                # Run all 819 tests once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

---

## Project Structure

```
.
├── src/
│   ├── assets/                  # CSS design system, static assets
│   │   └── main.css             # Tailwind config, design tokens, typography
│   ├── components/
│   │   ├── accounts/            # AccountCard, AddAccountSheet, EditAccountSheet, TotalBalanceCard
│   │   ├── budgets/             # BudgetCard, BudgetSummaryCard, CreateBudgetSheet, EditBudgetSheet
│   │   ├── categories/          # AddCategorySheet, CategoryListItem, EditCategorySheet
│   │   ├── charts/              # CategoryPieChart
│   │   ├── common/              # FAB, NumPad, AmountDisplay, Toast, ProgressBar, PercentBadge, etc.
│   │   ├── dashboard/           # DashboardHeader, HeroSection, RecentTransactions, UpcomingBills, BudgetProgressSection
│   │   ├── history/             # MonthSummaryRow, SortControls, MonthBudgetPerformance
│   │   ├── layout/              # BottomNav (5-tab with More popover)
│   │   ├── subscriptions/       # SubscriptionItem, RecurringSummaryCard, Add/EditSubscriptionSheet
│   │   └── transactions/        # AddTransactionSheet, EditTransactionSheet, Filters, List
│   ├── composables/             # Shared composition functions
│   │   └── useAuth.ts           # Reactive auth store wrapper
│   ├── graphql/
│   │   ├── mutations/           # Auth mutations (initializeUser)
│   │   └── queries/             # Accounts, categories, transactions, dashboard, history, budgets, subscriptions
│   ├── lib/
│   │   ├── firebase.ts          # Firebase app initialization
│   │   └── urql.ts              # GraphQL client with auth token & 401 handling
│   ├── pages/                   # Route-level components (9 pages)
│   ├── router/
│   │   └── index.ts             # Vue Router config with lazy-loaded routes
│   ├── stores/                  # Pinia stores (auth, accounts, categories, transactions, budgets, subscriptions, theme, toast)
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces mirroring GraphQL schema
│   ├── utils/                   # currency formatting, date grouping, tag parsing, greeting
│   ├── __tests__/               # 62 test files (819 tests total)
│   ├── App.vue                  # Root component (shell layout, FAB, BottomNav, Toast)
│   └── main.ts                  # App entry point (boot sequence)
├── index.html                   # SPA entry HTML
├── vite.config.ts               # Vite + Vitest + Tailwind config
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # App source TS config (strict mode)
├── tsconfig.node.json           # Tooling/config TS config
├── .env.example                 # Environment variable template
├── package.json                 # Dependencies & scripts
└── eslint.config.js             # ESLint config
```

> See [ARCHITECTURE.md](ARCHITECTURE.md) for a deep-dive into every layer, pattern, and design decision.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check (`vue-tsc`) then production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run all 819 tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with V8 coverage |
| `npm run lint` | Lint `.ts` and `.vue` files with auto-fix |
| `npm run format` | Format source with Prettier |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain (e.g. `project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_GRAPHQL_URL` | No | Override GraphQL URL (defaults to `/graphql`, proxied to backend) |

---

## Pages & Routes

| Path | Route Name | Page | Auth Required |
|------|-----------|------|:---:|
| `/login` | `login` | Login / Signup | No |
| `/dashboard` | `dashboard` | Dashboard (home) | Yes |
| `/history` | `history` | Monthly History | Yes |
| `/history/:month` | `monthDetail` | Month Detail | Yes |
| `/budgets` | `budgets` | Budgets | Yes |
| `/accounts` | `accounts` | Accounts | Yes |
| `/categories` | `categories` | Categories | Yes |
| `/subscriptions` | `subscriptions` | Subscriptions | Yes |
| `/settings` | `settings` | Settings | Yes |

All authenticated routes are lazy-loaded. The route guard redirects unauthenticated users to `/login`.

---

## Authentication

Firebase Auth handles user identity. The flow:

1. User logs in or signs up via the `LoginPage` (Firebase JS SDK)
2. `onAuthStateChanged` fires in `main.ts`, setting the user in the auth store
3. `onIdTokenChanged` keeps a cached token in `urql.ts`
4. Every GraphQL request includes `Authorization: Bearer <token>`
5. On 401 response, the custom urql exchange triggers logout + redirect

### First Login

On signup, the frontend calls the `initializeUser` mutation which provisions the user on the backend (default categories, cash account, currency preference).

---

## Design System

The app follows a "calm finance" aesthetic — clean, minimal, trustworthy, data-focused. Mobile-first responsive design.

### Design Tokens (defined in `src/assets/main.css`)

| Token | Light | Dark |
|-------|-------|------|
| `--color-surface` | `#ffffff` | `#1e1e2e` |
| `--color-surface-elevated` | `#f8fafc` | `#2a2a3c` |
| `--color-primary` | `#10b981` (emerald) | `#10b981` |
| `--color-danger` | `#ef4444` | `#f87171` |
| `--color-warning` | `#f59e0b` | `#fbbf24` |
| `--color-info` | `#3b82f6` | `#60a5fa` |

### Typography Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-hero-amount` | 36px | Dashboard total |
| `text-page-title` | 24px | Page headings |
| `text-section-title` | 18px | Section headings |
| `text-card-title` | 16px | Card titles |
| `text-body` | 14px | Body text |
| `text-caption` | 12px | Secondary info |
| `text-badge` | 11px | Badges, chips |

### Dark Mode

CSS class strategy: `.dark` class on `<html>`, managed by the theme store. Reads `localStorage` on init, falls back to `prefers-color-scheme`.

---

## Testing

819 tests across 62 test files, all using Vitest + Vue Test Utils + jsdom.

```bash
npm test                # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Test Coverage by Area

| Area | Files | Tests | Description |
|------|-------|-------|-------------|
| Stores | 5 | ~50 | Auth, categories, toast, budgets, subscriptions, theme store logic |
| Utilities | 4 | ~30 | Currency, date grouping, tag parsing, greeting |
| Pages | 8 | ~80 | Login, Dashboard, Accounts, Categories, History, MonthDetail, Budgets, Subscriptions, Settings |
| Components | 40 | ~620 | All UI components (sheets, lists, pickers, charts, dashboard sections, etc.) |
| Integration | 3 | ~10 | Route guard, urql 401 exchange, AppShell |

### Testing Patterns

- **Store mocks**: Module-level `ref()` variables + `vi.mock()` with `reactive()` getters
- **Teleported components** (Toast): Query `document.body` directly, clean up in `afterEach`
- **Inline style colors**: jsdom normalizes hex to `rgb()` — use regex assertions
- **Firebase/urql**: Always mocked at module level

---

## Connecting to the Backend

The Vite dev server proxies `/graphql` to `http://localhost:8080`:

```ts
// vite.config.ts
server: {
  proxy: {
    '/graphql': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
},
```

### Full Local Development Setup

```bash
# Terminal 1 — Database (from API repo)
make db-up && make migrate-up

# Terminal 2 — Backend API (from API repo)
make dev                # Go API on :8080

# Terminal 3 — Frontend (this repo)
npm run dev             # Vue app on :5173
```

The backend supports a **dev auth bypass** when `FIREBASE_CREDENTIALS_PATH` is not set. See the [API README](https://github.com/Get-Your-Money-Tracked/getyourmoneytracked-api) for details.

---

## Development Status

### Completed

- **EPIC-01**: Project bootstrap, Vue 3 + Vite + Tailwind 4 setup, design system
- **EPIC-02**: Firebase Auth integration, login/signup UI, route guards, app loader
- **EPIC-03**: Accounts management (list, create, edit, archive, total balance)
- **EPIC-04**: Categories management (list, create, edit, delete, reorder, nesting, picker)
- **EPIC-05**: Transactions (list, filters, create, edit, delete, date grouping, tags)
- **EPIC-06**: Dashboard (hero "Safe to Spend", progress bar, recent transactions, upcoming bills, budget progress)
- **EPIC-07**: Monthly History (history list with sorting, month detail with pie chart, category breakdown, budget performance)
- **EPIC-08**: Budgets (budget list sorted worst-first, create/edit/delete, progress bars, over-budget warnings)
- **EPIC-09**: Subscriptions (active/inactive lists, create/edit/deactivate, recurring cost summary)
- **EPIC-10**: Settings & Polish (profile card, dark mode toggle, logout flow, redesigned bottom nav with More popover)
- **Cross-EPIC Reviews**: 18+ issues identified and resolved (toast system, bottom nav, store reset, currency symbols, discard confirmation, tag filters, and more)

### V1 Feature Complete

All 10 frontend EPICs are implemented with 819 passing tests across 62 test files.

---

## License

[MIT](LICENSE)
