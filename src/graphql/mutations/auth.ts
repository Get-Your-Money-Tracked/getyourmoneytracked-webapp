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
