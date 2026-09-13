import { randomUUID } from 'node:crypto'

// Same-origin BFF: validation, numbering and persistence belong to the Go service.
export default defineEventHandler(async (event): Promise<unknown> => {
  const config = useRuntimeConfig(event)
  const requestId = randomUUID()
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Request-Id', requestId)
  if (event.method !== 'GET' && event.method !== 'POST') {
    setResponseStatus(event, 405)
    return {
      error: { code: 'method_not_allowed', message: 'Method not allowed', details: {}, requestId },
    }
  }
  if (event.method === 'POST') {
    const origin = getHeader(event, 'origin')
    if (origin && origin !== getRequestURL(event).origin) {
      setResponseStatus(event, 403)
      return {
        error: { code: 'origin_rejected', message: 'Origin not allowed', details: {}, requestId },
      }
    }
  }
  let body: string | undefined
  if (event.method === 'POST') {
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of event.node.req) {
      const buffer = Buffer.from(chunk)
      size += buffer.length
      if (size > 4 * 1024 * 1024) {
        setResponseStatus(event, 413)
        return {
          error: {
            code: 'body_too_large',
            message: 'ข้อมูลมีขนาดใหญ่เกินไป',
            details: {},
            requestId,
          },
        }
      }
      chunks.push(buffer)
    }
    body = Buffer.concat(chunks).toString('utf8')
  }
  try {
    const response = await $fetch.raw<unknown>('/api/v1/billing', {
      baseURL: config.apiBaseUrl,
      method: event.method,
      body,
      headers: { 'Content-Type': 'application/json' },
      timeout: Number(config.apiTimeoutMs),
      retry: 0,
      redirect: 'error',
      ignoreResponseError: true,
    })
    setResponseStatus(event, response.status)
    setHeader(event, 'X-Request-Id', response.headers.get('X-Request-Id') ?? requestId)
    return response._data
  } catch {
    setResponseStatus(event, 502)
    return {
      error: {
        code: 'upstream_unavailable',
        message: 'เชื่อมต่อบริการใบวางบิลไม่ได้ กรุณาลองใหม่',
        details: {},
        requestId,
      },
    }
  }
})
