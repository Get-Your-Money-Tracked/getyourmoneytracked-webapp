import { urqlClient } from '@/lib/urql'

const INITIALIZE_USER_MUTATION = `
  mutation InitializeUser($input: InitializeUserInput!) {
    initializeUser(input: $input) {
      id
      email
      displayName
      defaultCurrency
    }
  }
`

const UPDATE_USER_MUTATION = `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      email
      displayName
      defaultCurrency
    }
  }
`

const ME_QUERY = `
  query Me {
    me {
      id
      email
      displayName
      defaultCurrency
    }
  }
`

const DELETE_ACCOUNT_MUTATION = `
  mutation DeleteAccount {
    deleteAccount
  }
`

export interface MeResult {
  id: string
  email: string
  displayName: string
  defaultCurrency: string
}

export async function callInitializeUser(
  displayName: string,
  defaultCurrency: string,
): Promise<void> {
  const result = await urqlClient
    .mutation(INITIALIZE_USER_MUTATION, { input: { displayName, defaultCurrency } })
    .toPromise()

  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to initialize user account.')
  }
}

export async function callUpdateUser(
  displayName?: string,
  defaultCurrency?: string,
): Promise<MeResult> {
  const input: Record<string, string> = {}
  if (displayName !== undefined) input.displayName = displayName
  if (defaultCurrency !== undefined) input.defaultCurrency = defaultCurrency

  if (Object.keys(input).length === 0) {
    throw new Error('At least one field (displayName or defaultCurrency) must be provided.')
  }

  const result = await urqlClient
    .mutation(UPDATE_USER_MUTATION, { input })
    .toPromise()

  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to update user profile.')
  }
  if (!result.data?.updateUser) {
    throw new Error('No data returned from updateUser.')
  }
  return result.data.updateUser as MeResult
}

export async function callMe(): Promise<MeResult | null> {
  const result = await urqlClient
    .query(ME_QUERY, {}, { requestPolicy: 'network-only' })
    .toPromise()

  if (result.error) {
    // If user not found (new user pre-onboarding), return null instead of throwing
    if (result.error.message?.includes('user not found')) {
      return null
    }
    throw new Error(result.error.message ?? 'Failed to fetch user profile.')
  }
  return result.data?.me ?? null
}

export async function callDeleteAccount(): Promise<void> {
  const result = await urqlClient
    .mutation(DELETE_ACCOUNT_MUTATION, {})
    .toPromise()

  if (result.error) {
    throw new Error(result.error.message ?? 'Failed to delete account.')
  }
}
