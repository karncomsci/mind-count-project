import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

// Only fixed health paths are proxied in Phase 0; auth proxying arrives in Phase 1.
export async function proxyHealth(event: H3Event, path: '/health/live' | '/health/ready') {
  const config = useRuntimeConfig(event)
  const timeout = Number(config.apiTimeoutMs)
  const requestId = randomUUID()
  setHeader(event, 'X-Request-Id', requestId)
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    if (!Number.isFinite(timeout) || timeout <= 0) throw new Error('Invalid proxy timeout')
    const response = await $fetch.raw(path, {
      baseURL: config.apiBaseUrl,
      timeout,
      retry: 0,
      ignoreResponseError: true,
      redirect: 'error',
    })
    setResponseStatus(event, response.status)
    setHeader(event, 'X-Request-Id', response.headers.get('X-Request-Id') ?? requestId)
    return response._data
  }
  catch {
    setResponseStatus(event, 502)
    return { error: { code: 'upstream_unavailable', message: 'Service is temporarily unavailable', details: {}, requestId } }
  }
}
