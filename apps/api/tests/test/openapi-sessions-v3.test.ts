import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import yaml from 'yaml'

describe('OpenAPI sessions-v3 contract', () => {
  it('includes required paths and schemas', () => {
    const openapiPath = resolve(process.cwd(), 'openapi', 'sessions-v3.yaml')
    const raw = readFileSync(openapiPath, 'utf-8')
    const spec = yaml.parse(raw)

    expect(spec.openapi).toMatch(/^3\./)
    expect(spec.info?.title).toBeTruthy()

    expect(spec.paths?.['/v3/sessions/prompt']).toBeTruthy()
    expect(spec.paths?.['/v3/sessions/prompt/stream']).toBeTruthy()

    const promptPost = spec.paths['/v3/sessions/prompt'].post
    expect(
      promptPost?.requestBody?.content?.['application/json']?.schema?.['$ref'],
    ).toBe('#/components/schemas/SessionPromptRequest')

    const streamPost = spec.paths['/v3/sessions/prompt/stream'].post
    expect(
      streamPost?.requestBody?.content?.['application/json']?.schema?.['$ref'],
    ).toBe('#/components/schemas/SessionPromptRequest')
    expect(
      streamPost?.responses?.['200']?.content?.['text/event-stream'],
    ).toBeTruthy()

    const schemas = spec.components?.schemas
    expect(schemas?.SessionPromptRequest).toBeTruthy()
    expect(schemas?.SessionPromptResponse).toBeTruthy()
    expect(schemas?.SessionStreamEvent).toBeTruthy()
    expect(schemas?.SessionMessageInput).toBeTruthy()
  })
})
