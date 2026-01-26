import { FastifyRequest } from 'fastify'

export type TraceHeaders = {
  'sentry-trace'?: string
  baggage?: string
  'x-request-id'?: string
}

export const extractTraceHeaders = (request: FastifyRequest): TraceHeaders => {
  const sentryTrace = request.headers['sentry-trace']
  const baggage = request.headers['baggage']

  return {
    ...(typeof sentryTrace === 'string' ? { 'sentry-trace': sentryTrace } : {}),
    ...(typeof baggage === 'string' ? { baggage } : {}),
    'x-request-id': request.id,
  }
}
