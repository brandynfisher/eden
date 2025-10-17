import { handleSessionUpdateStreamEvent } from '../lib/eden2'
import { Message } from '../models/v2/Message'
import { Session } from '../models/v2/SessionV2'
import { FastifyPluginAsync } from 'fastify'
import { ChangeStreamDocument } from 'mongodb'

const WATCHED_COLLECTION = 'messages'

// Helper functions removed since we're now watching the messages collection directly

export const registerEden2SessionUpdates: FastifyPluginAsync =
  async fastify => {
    try {
      const messagesCollection =
        fastify.mongoose.connection.db.collection(WATCHED_COLLECTION)

      const changeStream = messagesCollection.watch(
        [
          {
            $match: {
              operationType: { $in: ['insert', 'update'] },
            },
          },
        ],
        { fullDocument: 'updateLookup' },
      )

      changeStream.on('change', async (data: ChangeStreamDocument<any>) => {
        try {
          if (data.operationType === 'insert') {
            const messageDoc = data.fullDocument

            if (!messageDoc) {
              fastify.log.error('insert: No fullDocument found')
              return
            }

            if (!messageDoc.session) {
              fastify.log.error(
                `insert: No session field found for message ${messageDoc._id}`,
              )
              return
            }

            // Get the session for this message
            const session = await Session.findById(messageDoc.session).populate(
              {
                path: 'owner',
                select: '_id',
              },
            )

            if (!session) {
              fastify.log.error(
                `insert: Session not found for message ${messageDoc._id}`,
              )
              return
            }

            // Populate the message sender
            await Message.populate(messageDoc, {
              path: 'sender',
              select: '_id username userImage',
            })

            await handleSessionUpdateStreamEvent(fastify, session, [messageDoc])
          } else if (data.operationType === 'update') {
            const messageDoc = data.fullDocument

            if (!messageDoc) {
              fastify.log.error('update: No fullDocument found')
              return
            }

            if (!messageDoc.session) {
              fastify.log.error(
                `update: No session field found for message ${messageDoc._id}`,
              )
              return
            }

            // Get the session for this message
            const session = await Session.findById(messageDoc.session).populate(
              {
                path: 'owner',
                select: '_id',
              },
            )

            if (!session) {
              fastify.log.error(
                `update: Session not found for message ${messageDoc._id}`,
              )
              return
            }

            // Populate the message sender
            await Message.populate(messageDoc, {
              path: 'sender',
              select: '_id username userImage',
            })

            // Populate any nested tool call creations if they exist
            if (messageDoc.tool_calls?.length) {
              await Message.populate(messageDoc, {
                path: 'tool_calls.result.output.creation',
                model: 'creations3',
                select: '_id user mediaAttributes tool filename',
                populate: {
                  path: 'user',
                  model: 'users3',
                  select: '_id username userImage',
                },
              })
            }

            await handleSessionUpdateStreamEvent(fastify, session, [messageDoc])
          }
        } catch (err) {
          fastify.log.error(
            'Failed to handle change stream onChange: Eden2SessionUpdates',
            { err },
          )
        }
      })

      fastify.addHook('onClose', (_instance, done) => {
        const streamClosePromise = changeStream.close()

        if (streamClosePromise) {
          streamClosePromise.then(() => {
            done()
            return
          })
        }

        done()
      })

      fastify.log.info('Successfully registered plugin: Eden2SessionUpdates')
    } catch (err) {
      fastify.log.error('Failed to register plugin: Eden2SessionUpdates', {
        err,
      })
    }
  }

export default registerEden2SessionUpdates
