import registerSessionsV3Schemas from '../../src/plugins/sessionsV3Schemas'
import { describe, expect, it, vi } from 'vitest'

const createFakeServer = () => {
  const schemas: any[] = []
  return {
    addSchema: (schema: any) => {
      schemas.push(schema)
    },
    log: {
      warn: vi.fn(),
    },
    __schemas: schemas,
  }
}

describe('sessions-v3 schema registration', () => {
  it('registers root and component schemas', async () => {
    const server = createFakeServer()

    // fastify-plugin wraps the function but remains callable
    // @ts-expect-error test double
    await registerSessionsV3Schemas(server)

    const ids = server.__schemas.map((schema: any) => schema.$id)

    expect(ids).toContain('sessions-v3')
    expect(ids).toContain(
      'sessions-v3#/components/schemas/SessionPromptRequest',
    )
    expect(ids).toContain(
      'sessions-v3#/components/schemas/SessionPromptResponse',
    )
    expect(ids).toContain('sessions-v3#/components/schemas/SessionStreamEvent')
  })
})
