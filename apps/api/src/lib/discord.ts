import { TaskV2Document } from '../models/v2/TaskV2'
import { FastifyInstance } from 'fastify'

async function sendDiscordNotification(
  fastify: FastifyInstance,
  task: TaskV2Document,
) {
  if (!fastify.config.DISCORD_TASK_ERROR_WEBHOOK_URL) {
    fastify.log.warn(
      'Discord webhook URL not configured, skipping notification',
    )
    return
  }

  fastify.log.info({
    msg: 'Prep Discord notification',
    url: fastify.config.DISCORD_TASK_ERROR_WEBHOOK_URL,
    task,
  })

  try {
    const taskBaseData = {
      embeds: [
        {
          title: '❌ Task failed',
          description: '',
          color: 0xff0000, // Red color
          fields: [
            {
              name: 'Tool',
              value: task.tool,
              inline: true,
            },
            {
              name: 'Output Type',
              value: task.output_type,
              inline: true,
            },
            {
              name: 'Error',
              value: task.error?.slice(0, 999) || 'No error message provided',
            },
            {
              name: 'Task',
              value: task._id.toString(),
              inline: true,
            },
            {
              name: 'Handler',
              value: task.handler_id
                ? `[${task.handler_id}](https://modal.com/apps/edenartlab/main/ap-NYQWipauyaWLt0YEAM9Fvm?fcId=${task.handler_id}&activeTab=functions&functionSection=calls&limit=100)`
                : 'n/a',
              inline: true,
            },
            {
              name: 'Cost',
              value: task.cost?.toFixed(0) || 'n/a',
            },
            {
              name: 'User',
              value: `[${task.user?.toString()}](${
                fastify.config.FRONTEND_URL
              }/creators/${task.user?.toString()})`,
              inline: true,
            },
            {
              name: 'Requester',
              value: `[${task.requester?.toString()}](${
                fastify.config.FRONTEND_URL
              }/creators/${task.requester?.toString()})`,
              inline: true,
            },
          ],
          // timestamp: new Date().toISOString()
        },
      ],
    }

    const taskArgs = {
      embeds: [
        {
          title: '🔍 Args',
          description: `\`\`\`json\n${JSON.stringify(task.args, null, 2).slice(
            0,
            4000,
          )}\n\`\`\``,
          // timestamp: new Date().toISOString()
        },
      ],
    }

    fastify.log.info({
      msg: 'Sending Discord notifications',
      url: fastify.config.DISCORD_TASK_ERROR_WEBHOOK_URL,
      messages: [taskBaseData, taskArgs],
    })

    // Send first message
    fetch(fastify.config.DISCORD_TASK_ERROR_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskBaseData),
    }).catch(err => {
      fastify.log.error({ msg: 'Failed to send Discord notification', err })
    })

    // Wait before sending second message
    setTimeout(() => {
      if (!fastify.config.DISCORD_TASK_ERROR_WEBHOOK_URL) {
        fastify.log.warn(
          'Discord webhook URL not configured, skipping notification',
        )
        return
      }
      fetch(fastify.config.DISCORD_TASK_ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskArgs),
      }).catch(err => {
        fastify.log.error({ msg: 'Failed to send Discord notification', err })
      })
    }, 2000)
  } catch (err) {
    fastify.log.error({ msg: 'Error preparing Discord notification', err })
  }
}

export { sendDiscordNotification }
