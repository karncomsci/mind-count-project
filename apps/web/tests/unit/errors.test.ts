import { describe, expect, it } from 'vitest'
import { ApiError, parseApiError } from '../../app/lib/api/errors'

describe('API error contract', () => {
  it('preserves a valid error and request ID', () => {
    const error = parseApiError({ error: { code: 'unavailable', message: 'Service unavailable', details: {}, requestId: 'request-1' } }, 503)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.requestId).toBe('request-1')
    expect(error.status).toBe(503)
  })
  it('does not expose an unknown upstream response', () => {
    const error = parseApiError('<html>private failure</html>', 502)
    expect(error.code).toBe('unexpected_response')
    expect(error.message).toBe('The server returned an unexpected response.')
  })
})
