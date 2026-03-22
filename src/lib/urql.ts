import { createClient, fetchExchange } from '@urql/vue'
import { mapExchange } from '@urql/core'
import type { Exchange } from '@urql/core'
import { auth } from '@/lib/firebase'

// Cache the last known token; refreshed by onIdTokenChanged
let cachedToken: string | null = null

export function setCachedToken(token: string | null) {
  cachedToken = token
}

// Keep cache fresh whenever Firebase silently refreshes the token (AC6)
auth.onIdTokenChanged(async (user) => {
  if (user) {
    // getIdToken(true) forces a network refresh when the token is about to expire
    const token = await user.getIdToken(true)
    setCachedToken(token)
  } else {
    setCachedToken(null)
  }
})

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
      const status = (result.error.networkError as { statusCode?: number; status?: number })
        .statusCode
      if (status === 401 && onUnauthorizedCallback) {
        onUnauthorizedCallback()
      }
    }
    return result
  },
})

// ── urql client ───────────────────────────────────────────────────────────────
export const urqlClient = createClient({
  url: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
  exchanges: [unauthorizedExchange, fetchExchange],
  fetchOptions: () => {
    if (!cachedToken) return {}
    return {
      headers: {
        Authorization: `Bearer ${cachedToken}`,
      },
    }
  },
})
