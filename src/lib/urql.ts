import { createClient, fetchExchange } from '@urql/vue'
import { mapExchange, cacheExchange } from '@urql/core'
import type { Exchange } from '@urql/core'
import { auth } from '@/lib/firebase'

// ── Token management ─────────────────────────────────────────────────────────
// Cache the last known token; refreshed by onIdTokenChanged and on every request.
let cachedToken: string | null = null

/**
 * Resolves once Firebase has delivered its first token (or confirmed no user).
 * Prevents API calls from racing ahead of auth initialization — especially
 * important on first login in a private/incognito tab.
 */
let resolveTokenReady: () => void
const tokenReady = new Promise<void>((resolve) => {
  resolveTokenReady = resolve
})

export function setCachedToken(token: string | null) {
  cachedToken = token
}

// Keep cache fresh whenever Firebase silently refreshes the token (AC6).
// NOTE: getIdToken() (without `true`) returns the SDK-cached token when still
// valid and only makes a network call when it is expired/about to expire.
// Using `true` here previously caused a race condition on login — the forced
// network refresh was still in-flight while API calls were already going out
// with a stale/null token.
auth.onIdTokenChanged(async (user) => {
  if (user) {
    const token = await user.getIdToken()
    setCachedToken(token)
  } else {
    setCachedToken(null)
  }
  // Signal that the initial token state is known (first callback only matters
  // but resolving multiple times is harmless on an already-resolved promise).
  resolveTokenReady()
})

/**
 * Get a fresh token, waiting for Firebase if needed.
 * On the very first call this awaits `tokenReady` so we never send a request
 * before Firebase has had a chance to set the token.
 */
async function getFreshToken(): Promise<string | null> {
  await tokenReady
  const user = auth.currentUser
  if (!user) return cachedToken
  const token = await user.getIdToken()
  cachedToken = token
  return token
}

// ── 401 exchange ─────────────────────────────────────────────────────────────
// When the server returns a 401 we call onUnauthorizedCallback so the app can
// log the user out and redirect to /login (wired up in main.ts).
//
// The callback is suppressed while `authReady` is false — during the initial
// auth setup window, a transient 401 (e.g. from hydrateFromApi racing a slow
// token refresh) should NOT force-logout the user.

let onUnauthorizedCallback: (() => void) | null = null
let authReady = false

export function setOnUnauthorized(cb: () => void) {
  onUnauthorizedCallback = cb
}

/** Call once auth initialization is complete to enable 401 auto-logout. */
export function markAuthReady() {
  authReady = true
}

const unauthorizedExchange: Exchange = mapExchange({
  onResult(result) {
    if (result.error?.networkError) {
      const err = result.error.networkError as { statusCode?: number; status?: number }
      const status = err.statusCode ?? err.status
      if (status === 401 && authReady && onUnauthorizedCallback) {
        onUnauthorizedCallback()
      }
    }
    return result
  },
})

// ── Custom fetch that injects the auth token ─────────────────────────────────
// urql's fetchOptions is synchronous and can't await a token. Using a custom
// fetch function lets us await getIdToken() before every request, guaranteeing
// the Authorization header is set even on the very first request after login.
const authenticatedFetch: typeof globalThis.fetch = async (input, init) => {
  const token = await getFreshToken()
  const headers = new Headers(init?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}

// ── urql client ───────────────────────────────────────────────────────────────
export const urqlClient = createClient({
  url: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
  // Force POST for all operations — the Go backend only accepts POST on /graphql.
  // urql defaults to 'within-url-limit' (GET for short queries), which the backend rejects.
  preferGetMethod: false,
  exchanges: [unauthorizedExchange, cacheExchange, fetchExchange],
  fetch: authenticatedFetch,
})
