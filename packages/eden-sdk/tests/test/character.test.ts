import { describe, expect, test } from 'vitest'

describe('Character Methods', () => {
  test('should return a list of API Keys', async context => {
    const { client } = context
    const result = await client.characters.list()
    expect(result).toBeDefined()
    expect(result.docs).toBeDefined()
  })

  test('should be able to pass pagination options', async context => {
    const { client } = context
    const result = await client.characters.list({
      limit: 1,
      page: 1,
    })
    expect(result).toBeDefined()
    expect(result.docs).toBeDefined()
  })

  test('should create a Character', async context => {
    const { client } = context
    const result = await client.characters.create({
      name: 'Test Character',
    })
    expect(result).toBeDefined()
    expect(result.characterId).toBeDefined()
  })

  test('should update a Character', async context => {
    const { client } = context
    const createResults = await client.characters.list({
      limit: 1,
    })
    const characterId = createResults.docs[0].id
    const result = await client.characters.update({
      characterId,
      description: 'Test Character',
    })
    expect(result).toBeDefined()
  })

  test('should be able to get character by id', async context => {
    const { client } = context
    const createResults = await client.characters.list({
      limit: 1,
    })
    const characterId = createResults.docs[0].id
    const result = await client.characters.get({
      characterId,
    })
    expect(result).toBeDefined()
  })

  test('should delete a charatcer', async context => {
    const { client } = context
    const createResults = await client.characters.list({
      limit: 1,
    })
    const characterId = createResults.docs[0].id
    const result = await client.characters.delete({
      characterId,
    })
    expect(result).toBeDefined()
  })
})
