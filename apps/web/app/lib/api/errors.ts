import { z } from 'zod'

const envelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()),
    requestId: z.string(),
  }),
})

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details: Record<string, unknown> = {},
    public readonly requestId = '',
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function parseApiError(value: unknown, status: number): ApiError {
  const parsed = envelopeSchema.safeParse(value)
  if (!parsed.success) return new ApiError('unexpected_response', 'The server returned an unexpected response.', status)
  const { code, message, details, requestId } = parsed.data.error
  return new ApiError(code, message, status, details, requestId)
}
