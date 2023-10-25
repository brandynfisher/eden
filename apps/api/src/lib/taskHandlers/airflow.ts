import { FastifyInstance } from 'fastify'
import { v4 as uuidv4 } from 'uuid'

export const submitMonologueTask = async (
  server: FastifyInstance,
  config: any,
) => {
  if (!server.airflow) {
    throw new Error('Airflow not registered')
  }
  const taskId = uuidv4()
  await server.airflow.submitTask({
    dagId: 'handler_monologue',
    taskId,
    config: {
      prompt: config.prompt,
      character_name: 'Chatsubo',
      character_description: 'Chatsubo is a benevolent fire god.',
    },
  })
  return taskId
}
