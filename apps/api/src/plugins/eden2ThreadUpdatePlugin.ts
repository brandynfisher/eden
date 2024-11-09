import { handleThreadUpdateStreamEvent } from '../lib/eden2'
import { FastifyPluginAsync } from 'fastify'
import { ChangeStreamDocument, UpdateDescription } from 'mongodb'

const WATCHED_COLLECTION = 'threads'

export const registerEden2ThreadUpdates: FastifyPluginAsync = async fastify => {
  try {
    const threadCollection =
      fastify.mongoose.connection.db.collection(WATCHED_COLLECTION)

    const changeStream = threadCollection.watch(
      [
        {
          $match: {
            'fullDocument.updatedAt': {
              $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        },
      ],
      { fullDocument: 'updateLookup' },
    )

    changeStream.on('change', async (data: ChangeStreamDocument<any>) => {
      try {
        // fastify.log.info({
        //   msg: 'Task change stream event received',
        //   operationType: data.operationType,
        // })

        if (
          data.operationType === 'insert' ||
          data.operationType === 'update'
        ) {
          // fastify.log.info({
          //   msg: `Thread DB event: ${data.operationType} `,
          //   doc: data.fullDocument,
          // })

          const updatedFields =
            data.operationType === 'update'
              ? (data.updateDescription as UpdateDescription).updatedFields
              : undefined

          await handleThreadUpdateStreamEvent(
            fastify,
            data.fullDocument as any,
            updatedFields,
          )
        }
      } catch (err) {
        fastify.log.error(
          'Failed to handle change stream onChange: Eden2Tasks',
          { err },
        )
      }
    })

    fastify.addHook('onClose', (_instance, done) => {
      const streamClosePromise = changeStream.close()

      if (streamClosePromise) {
        streamClosePromise.then(() => {
          fastify.log.info('Task change stream closed')
          done()
          return
        })
      }

      done()
    })

    fastify.log.info('Successfully registered plugin: Eden2ThreadUpdates')
  } catch (err) {
    fastify.log.error('Failed to register plugin: Eden2ThreadUpdates', { err })
  }
}

export default registerEden2ThreadUpdates
