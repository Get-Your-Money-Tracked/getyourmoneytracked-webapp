import { createClient, fetchExchange } from '@urql/vue'
import { mapExchange, cacheExchange } from '@urql/core'
import type { Exchange } from '@urql/core'
import { auth } from '@/lib/firebase'

// ── Token management ─────────────────────────────────────────────────────────
// Cache the last known token; refreshed by onIdTokenChanged and on every request.
let cachedToken: string | null = null

export function setCachedToken(token: string | null) {
  cachedToken = token
}

// Keep cache fresh whenever Firebase silently refreshes the token (AC6)
auth.onIdTokenChanged(async (user) => {
  if (user) {
    const token = await user.getIdToken(true)
    setCachedToken(token)
  } else {
    setCachedToken(null)
  }
})

/**
 * Get a fresh token, waiting for Firebase if needed.
 * `getIdToken()` without `true` returns the cached token instantly when valid
 * and only makes a network call when the token is expired/about to expire.
 */
async function getFreshToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return cachedToken
  const token = await user.getIdToken()
  cachedToken = token
  return token
}

// ── 401 exchange ─────────────────────────────────────────────────────────────
// When the server returns a 401 we call onUnauthorizedCallback so the app can
// log the user out and redirect to /login (wired up in main.ts).

let onUnauthorizedCallback: (() => void) | null = null

export function setOnUnauthorized(cb: () => void) {
  onUnauthorizedCallback = cb
}

const unauthorizedExchange: Exchange = mapExchange({
  onResult(result) {
    if (result.error?.networkError) {
      const err = result.error.networkError as { statusCode?: number; status?: number }
      const status = err.statusCode ?? err.status
      if (status === 401 && onUnauthorizedCallback) {
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
