import { FastifyInstance } from 'fastify'

export const getSimilarCreationIds = async (
  server: FastifyInstance,
  creationId: any,
) => {
  console.log('##### get creation similar 4a', creationId)
  const { chromadb } = server
  if (!chromadb) {
    throw new Error('Chromadb not initialized')
  }
  console.log('##### get creation similar 4b', creationId)
  console.log('##### get collection')
  const collection = await chromadb.getCollection({
    name: 'creation_clip_embeddings',
  })
  console.log('##### got collection')
  console.log(collection)
  console.log('##### get creation similar 5', creationId)
  console.log(collection)
  if (!collection) {
    throw new Error('Chromadb collection not found')
  }
  console.log('##### get creation similar 6', creationId)
  console.log(creationId.toString())
  // get embedding
  const document = await collection.get({
    ids: [creationId.toString()],
  })
  console.log('##### get creation similar 7', creationId)
  console.log('##### -> similar')
  console.log(document)

  if (!document?.embeddings || !document.embeddings[0]) {
    throw new Error(`Chromadb failed to find creation ${creationId}`)
  }

  console.log('##### get creation similar 8', creationId)
  const embedding = document.embeddings[0]

  console.log('-> embedding')
  console.log(embedding)
  console.log('##### get creation similar 9', creationId)

  const results = await collection.query({
    queryEmbeddings: [embedding],
    nResults: 11,
  })

  console.log('##### get creation similar 10', creationId)
  console.log(results)

  if (!results?.ids) {
    throw new Error('Chromadb query failed')
  }

  console.log('##### get creation similar 11', creationId)
  console.log(results.ids)

  console.log(results.ids[0])

  return results.ids[0].slice(1)
}
