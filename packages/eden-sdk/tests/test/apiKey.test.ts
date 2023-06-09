import { NewApiKey } from 'src/responses/ApiKeysCreateResponse'
import { describe, expect, test } from 'vitest'

describe('API Key Methods', () => {
  test('should return a list of API Keys', async context => {
    const { client } = context
    const result = await client.apiKeys.get()
    expect(result).toBeDefined()
    expect(result.docs).toBeDefined()
    expect(result.docs.length).toBeGreaterThan(0)
  })

  test('should be able to pass pagination options', async context => {
    const { client } = context
    const result = await client.apiKeys.get({
      limit: 1,
      page: 1,
    })
    expect(result).toBeDefined()
    expect(result.docs).toBeDefined()
    expect(result.docs.length).toBe(1)
  })

  test('should create an API Key', async context => {
    const { client } = context
    const result = await client.apiKeys.create({
      note: 'test',
    })
    expect(result).toBeDefined()
    expect(result.apiKey).toBeDefined()

    const expectedApiKeyProperties: Partial<NewApiKey> = {
      apiKey: expect.any(String),
      apiSecret: expect.any(String),
    }

    expect(result.apiKey).toMatchObject(expectedApiKeyProperties)
  })

  test('should delete an API Key', async context => {
    const { client } = context
    const createResults = await client.apiKeys.create({
      note: 'test',
    })
    const apiKey = createResults.apiKey.apiKey
    const result = await client.apiKeys.delete({
      apiKey,
    })
    expect(result).toBeDefined()
  })
})
