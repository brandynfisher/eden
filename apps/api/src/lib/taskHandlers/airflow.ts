import { FastifyInstance } from 'fastify'
import { v4 as uuidv4 } from 'uuid'

export const submitMonologueTask = async (server: FastifyInstance) => {
  if (!server.airflow) {
    throw new Error('Airflow not registered')
  }
  const taskId = uuidv4()
  await server.airflow.submitTask({
    dagId: 'handler_monologue',
    taskId,
  })
  return taskId
}
