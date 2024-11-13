import { handleThreadUpdateStreamEvent } from '../lib/eden2'
import { MessageSchema, ThreadDocument } from '../models/v2/Thread'
import { FastifyPluginAsync } from 'fastify'
import { ChangeStreamDocument, UpdateDescription } from 'mongodb'

const WATCHED_COLLECTION = 'threads'

export const registerEden2ThreadUpdates: FastifyPluginAsync = async fastify => {
  try {
    const threadCollection =
      fastify.mongoose.connection.db.collection(WATCHED_COLLECTION)

    // const changeStream = threadCollection.watch(
    //   [
    //     {
    //       $match: {
    //         'fullDocument.updatedAt': {
    //           $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    //         },
    //         $or: [
    //           { 'updateDescription.updatedFields.messages': { $exists: true } },
    //           { operationType: 'insert' }
    //         ]
    //       },
    //     },
    //   ],
    //   { fullDocument: 'updateLookup' },
    // )

    const changeStream = threadCollection.watch(
      [
        {
          $match: {
            operationType: { $in: ['insert', 'update'] },
          },
        },
      ],
      { fullDocument: 'updateLookup' },
    )

    changeStream.on(
      'change',
      async (data: ChangeStreamDocument<ThreadDocument>) => {
        fastify.log.info('Change stream onChange: Eden2Tasks')

        try {
          if (data.operationType === 'insert') {
            // Handle insert event as usual
            await handleThreadUpdateStreamEvent(
              fastify,
              data.fullDocument,
              undefined,
            )
          } else if (data.operationType === 'update') {
            const updatedFields = (data.updateDescription as UpdateDescription)
              .updatedFields

            if (updatedFields && updatedFields.messages) {
              // slice of the last messages from updatedFields.messages up until but not including the last message with message.role: 'user'
              const messages = updatedFields.messages as MessageSchema[]
              const lastUserMessageIndex = messages.findLastIndex(
                message => message.role === 'user',
              )
              const newMessages = messages.slice(lastUserMessageIndex + 1)

              // console.log({newMessages})

              // Only pass the updated messages field
              await handleThreadUpdateStreamEvent(
                fastify,
                data.fullDocument,
                newMessages,
              )
            }
          }
        } catch (err) {
          fastify.log.error(
            'Failed to handle change stream onChange: Eden2Tasks',
            { err },
          )
        }
      },
    )

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
