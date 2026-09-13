import createClient from 'openapi-fetch'
import type { paths } from './generated/schema'

// Create per request on SSR; never store cookies in a module-global client.
export function createApiClient(baseUrl = '', fetcher: typeof fetch = fetch) {
  return createClient<paths>({ baseUrl, fetch: fetcher, credentials: 'same-origin' })
}
