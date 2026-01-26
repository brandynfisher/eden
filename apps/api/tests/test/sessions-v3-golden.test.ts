import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

describe('sessions-v3 golden fixtures', () => {
  it('loads expected fixture payloads', () => {
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

    expect(request.message.content).toBe('hello from test')
    expect(requestCreate.creation.agent_ids).toHaveLength(2)
    expect(response.session_id).toBe('session-123')
  })
})
