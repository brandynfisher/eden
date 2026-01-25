import Ajv from 'ajv'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import yaml from 'yaml'

const loadSpec = () => {
  const openapiPath = resolve(process.cwd(), 'openapi', 'sessions-v3.yaml')
  const raw = readFileSync(openapiPath, 'utf-8')
  return yaml.parse(raw)
}

const rewriteRefs = (schema: any): any => {
  if (Array.isArray(schema)) {
    return schema.map(item => rewriteRefs(item))
  }
  if (schema && typeof schema === 'object') {
    const next: any = {}
    for (const [key, value] of Object.entries(schema)) {
      if (key === '$ref' && typeof value === 'string') {
        if (value.startsWith('#/components/schemas/')) {
          next.$ref = `sessions-v3${value}`
        } else {
          next.$ref = value
        }
      } else {
        next[key] = rewriteRefs(value)
      }
    }
    return next
  }
  return schema
}

const buildAjv = (spec: any) => {
  const ajv = new Ajv({ allErrors: true, strict: false })
  const schemas = spec.components?.schemas || {}
  for (const [name, schema] of Object.entries(schemas)) {
    ajv.addSchema({
      $id: `sessions-v3#/components/schemas/${name}`,
      ...rewriteRefs(schema),
    })
  }
  return ajv
}

describe('sessions-v3 schema validation (AJV)', () => {
  it('validates example request/response payloads', () => {
    const spec = loadSpec()
    const ajv = buildAjv(spec)

    const validateRequest = ajv.getSchema(
      'sessions-v3#/components/schemas/SessionPromptRequest',
    )
    const validateResponse = ajv.getSchema(
      'sessions-v3#/components/schemas/SessionPromptResponse',
    )
    const validateEvent = ajv.getSchema(
      'sessions-v3#/components/schemas/SessionStreamEvent',
    )

    if (!validateRequest || !validateResponse || !validateEvent) {
      throw new Error('Failed to register schemas in AJV')
    }

    const request = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          'tests',
          'fixtures',
          'session-prompt-request.json',
        ),
        'utf-8',
      ),
    )

    const requestCreate = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          'tests',
          'fixtures',
          'session-prompt-request-create.json',
        ),
        'utf-8',
      ),
    )

    const response = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          'tests',
          'fixtures',
          'session-prompt-response.json',
        ),
        'utf-8',
      ),
    )

    const event = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          'tests',
          'fixtures',
          'session-stream-event.json',
        ),
        'utf-8',
      ),
    )

    expect(validateRequest(request)).toBe(true)
    expect(validateRequest(requestCreate)).toBe(true)
    expect(validateResponse(response)).toBe(true)
    expect(validateEvent(event)).toBe(true)
  })

  it('rejects invalid payloads', () => {
    const spec = loadSpec()
    const ajv = buildAjv(spec)
    const validateRequest = ajv.getSchema(
      'sessions-v3#/components/schemas/SessionPromptRequest',
    )

    if (!validateRequest) {
      throw new Error('Failed to register schemas in AJV')
    }

    const badRequest = {
      message: {
        attachments: ['missing content'],
      },
    }

    expect(validateRequest(badRequest)).toBe(false)
  })
})
