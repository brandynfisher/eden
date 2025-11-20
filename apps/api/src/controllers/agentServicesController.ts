import { Agent } from '../models/Agent'
import {
  AgentPermission,
  AgentPermissionLevel,
} from '../models/AgentPermission'
import { Deployment } from '../models/Deployment'
import { EmailDomain } from '../models/EmailDomain'
import { Trigger } from '../models/Trigger'
import { Message } from '../models/v2/Message'
import { Session } from '../models/v2/SessionV2'
import { forceCloudfrontUrl } from '../plugins/s3Plugin'
import { createIdOrSlugQuery } from '../utils/mongoUtils'
import {
  AgentsCreateTriggerArguments,
  AgentsCreateTriggerResponse,
  AgentsDeleteTriggerResponse,
  AgentsDeployArguments,
  AgentsDeployResponse,
  AgentsStopDeploymentArguments,
  AgentsStopDeploymentResponse,
  AgentsUpdateDeploymentArguments,
  FeatureFlag,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

// Helper function to check if user has owner-level permissions
const hasOwnerPermissions = async (
  agentId: string,
  userId: string,
): Promise<boolean> => {
  // Check if user is the original owner
  const agent = await Agent.findById(agentId)
  if (!agent) return false

  if (agent.owner.toString() === userId) {
    return true
  }

  // Check if user has owner permission
  const permission = await AgentPermission.findOne({
    agent: agentId,
    user: userId,
    level: AgentPermissionLevel.Owner,
  })

  return !!permission
}

const calculateNextScheduledRun = (schedule: any): Date | null => {
  if (!schedule) return null

  const now = new Date()

  // For one-time tasks (start_date equals end_date)
  if (schedule.start_date && schedule.end_date) {
    const startDate = new Date(schedule.start_date)
    const endDate = new Date(schedule.end_date)

    if (startDate.getTime() === endDate.getTime()) {
      // One-time task
      return startDate > now ? startDate : null
    }
  }

  // For hourly tasks (hour is '*')
  if (schedule.hour === '*' && schedule.minute !== undefined) {
    const nextRun = new Date()
    const targetMinute = parseInt(schedule.minute.toString(), 10)

    // Set to the target minute in the current hour
    nextRun.setMinutes(targetMinute)
    nextRun.setSeconds(0)
    nextRun.setMilliseconds(0)

    // If that time has already passed in this hour, move to the next hour
    if (nextRun <= now) {
      nextRun.setHours(nextRun.getHours() + 1)
    }

    return nextRun
  }

  // For recurring tasks, calculate next run based on current time
  if (schedule.hour !== undefined && schedule.minute !== undefined) {
    const nextRun = new Date()
    nextRun.setHours(parseInt(schedule.hour.toString(), 10))
    nextRun.setMinutes(parseInt(schedule.minute.toString(), 10))
    nextRun.setSeconds(0)
    nextRun.setMilliseconds(0)

    // If the time today has passed, move to next occurrence based on schedule
    if (nextRun <= now) {
      if (schedule.day_of_week === '*') {
        // Daily - add 1 day
        nextRun.setDate(nextRun.getDate() + 1)
      } else if (schedule.day_of_week) {
        // Weekly - find next occurrence of the day
        const targetDay = parseInt(schedule.day_of_week.toString(), 10)
        const currentDay = nextRun.getDay()
        let daysUntilNext = targetDay - currentDay
        if (daysUntilNext <= 0) daysUntilNext += 7
        nextRun.setDate(nextRun.getDate() + daysUntilNext)
      } else if (schedule.month && schedule.day) {
        // Annually - find next occurrence
        const targetMonth = parseInt(schedule.month.toString(), 10) - 1 // 0-indexed
        const targetDay = parseInt(schedule.day.toString(), 10)
        nextRun.setMonth(targetMonth)
        nextRun.setDate(targetDay)
        if (nextRun <= now) {
          nextRun.setFullYear(nextRun.getFullYear() + 1)
        }
      } else if (schedule.day) {
        // Monthly - find next occurrence of the day
        const targetDay = parseInt(schedule.day.toString(), 10)
        nextRun.setDate(targetDay)
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1)
        }
      }
    }

    return nextRun
  }

  return null
}

const validateAgentAccess = async (agentId: string) => {
  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent || agent.deleted) {
    return { agent: null, error: 'Agent not found' }
  }

  return { agent, error: null }
}

const createAgentObjectId = (agentId: string, agentDoc: any, mongoose: any) => {
  return mongoose.Types.ObjectId.isValid(agentId)
    ? new mongoose.Types.ObjectId(agentId)
    : new mongoose.Types.ObjectId(agentDoc._id)
}

export const getAgentTriggers = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const currentUserId = request.user.userId
  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to view triggers for this agent',
    })
  }

  const triggers = await Trigger.find({
    agent: agentId,
    $or: [{ deleted: { $exists: false } }, { deleted: false }],
  })

  return reply.status(200).send({
    triggers,
  })
}

export const getAgentTrigger = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId, triggerId } = request.params as {
    agentId: string
    triggerId: string
  }
  const currentUserId = request.user.userId
  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to view triggers for this agent',
    })
  }

  const trigger = await Trigger.findOne({
    _id: triggerId,
    agent: agentId,
    $or: [{ deleted: { $exists: false } }, { deleted: false }],
  })

  if (!trigger) {
    return reply.status(404).send({
      error: 'Trigger not found',
    })
  }

  return reply.status(200).send({
    trigger,
  })
}

export const createAgentTrigger = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const {
    name,
    context,
    trigger_prompt,
    session_type,
    session,
    schedule,
    posting_instructions,
  } = request.body as Omit<AgentsCreateTriggerArguments, 'agentId'>
  const currentUserId = request.user.userId
  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to create triggers for this agent',
    })
  }

  const updateData = {
    agent: agentId,
    user: currentUserId,
    name,
    context,
    trigger_prompt,
    session_type,
    session,
    schedule,
    posting_instructions: posting_instructions || [],
  }

  const edenComputeRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/triggers/create`,
    data: updateData,
  }

  const edenComputeResponse = await axios.post(
    edenComputeRequest.endpoint,
    edenComputeRequest.data,
    {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    },
  )

  const response = edenComputeResponse.data as AgentsCreateTriggerResponse

  // NOTE: Mongo save is handled downstream in the compute API, not here
  // // Save the trigger locally with the name field
  // const localTriggerData = {
  //   agent: agentId,
  //   user: currentUserId,
  //   name,
  //   context,
  //   trigger_prompt,
  //   session_type,
  //   session,
  //   schedule,
  //   posting_instructions,
  // }

  // const localTrigger = new Trigger(localTriggerData)
  // await localTrigger.save()

  return reply.status(200).send({
    triggerId: response.trigger_id,
  })
}

export const updateAgentTrigger = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId, triggerId } = request.params as {
    agentId: string
    triggerId: string
  }
  const {
    name,
    context,
    trigger_prompt,
    session_type,
    session,
    schedule,
    status,
    posting_instructions,
  } = request.body as {
    name?: string
    context?: string
    trigger_prompt?: any
    session_type?: 'new' | 'another'
    session?: string | null
    schedule?: any
    status?: 'active' | 'paused' | 'finished'
    posting_instructions?: any
  }
  const currentUserId = request.user.userId

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to update triggers for this agent',
    })
  }

  // Find the trigger to update
  const trigger = await Trigger.findById(triggerId)

  if (!trigger) {
    return reply.status(404).send({
      error: 'Trigger not found',
    })
  }

  // Verify the trigger belongs to the agent
  if (trigger.agent.toString() !== agentId) {
    return reply.status(401).send({
      error: 'Trigger does not belong to this agent',
    })
  }

  // Validate schedule if provided
  if (schedule !== undefined) {
    const nextRun = calculateNextScheduledRun(schedule)
    if (nextRun) {
      const now = new Date()
      const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000)

      if (nextRun < twoMinutesFromNow) {
        return reply.status(400).send({
          error: 'Next scheduled run must be at least 2 minutes in the future',
        })
      }
    }
  }

  // Build update data - only include fields that are provided
  // IMPORTANT: Never update the 'user' field - it should only be set on creation
  const updateData: any = {}

  if (name !== undefined) updateData.name = name
  if (context !== undefined) updateData.context = context
  if (trigger_prompt !== undefined) updateData.trigger_prompt = trigger_prompt
  if (session_type !== undefined) updateData.session_type = session_type
  if (session !== undefined) updateData.session = session
  if (schedule !== undefined) {
    updateData.schedule = schedule
    // Calculate and update next_scheduled_run when schedule is updated
    updateData.next_scheduled_run = calculateNextScheduledRun(schedule)
  }
  if (status !== undefined) updateData.status = status
  if (posting_instructions !== undefined)
    updateData.posting_instructions = posting_instructions

  // do not overwrite the original user who owns that Trigger
  delete updateData.user

  // Update the trigger
  const updatedTrigger = await Trigger.findByIdAndUpdate(
    triggerId,
    updateData,
    { new: true },
  )

  return reply.status(200).send({
    trigger: updatedTrigger,
  })
}

export const deleteAgentTrigger = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId, triggerId } = request.params as {
    agentId: string
    triggerId: string
  }
  const currentUserId = request.user.userId

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to delete triggers for this agent',
    })
  }

  const edenComputeRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/triggers/delete`,
    data: { id: triggerId },
  }

  const edenComputeResponse = await axios.post(
    edenComputeRequest.endpoint,
    edenComputeRequest.data,
    {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    },
  )

  const response = edenComputeResponse.data as AgentsDeleteTriggerResponse

  return reply.status(200).send({
    success: response.success,
  })
}

export const executeAgentTrigger = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { trigger_id } = request.body as { trigger_id: string }
  const currentUserId = request.user.userId

  if (!trigger_id) {
    return reply.status(400).send({
      message: 'Missing trigger_id',
    })
  }

  // First, get the trigger to check ownership
  const trigger = await Trigger.findById(trigger_id)
  if (!trigger) {
    return reply.status(404).send({
      message: 'Trigger not found',
    })
  }

  // Check if the user owns the agent that this trigger belongs to
  const agent = await Agent.findById(trigger.agent)
  if (!agent) {
    return reply.status(404).send({
      message: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(403).send({
      message: 'User not authorized to execute triggers for this agent',
    })
  }

  try {
    const edenComputeRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/triggers/run`,
      data: { trigger_id },
    }

    const edenComputeResponse = await axios.post(
      edenComputeRequest.endpoint,
      edenComputeRequest.data,
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    const response = edenComputeResponse.data

    return reply.status(200).send({
      trigger_id,
      executed: response.executed || true,
      chat_response: response.chat_response,
    })
  } catch (error) {
    server.log.error({ err: error }, 'Error executing trigger:')

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500
      const message =
        error.response?.data?.message || 'Failed to execute trigger'

      return reply.status(status).send({
        message,
      })
    }

    return reply.status(500).send({
      message: 'Internal server error',
    })
  }
}

export const getAgentDeployments = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const currentUserId = request.user.userId
  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to view deployments for this agent',
    })
  }

  const deployments = await Deployment.find({
    agent: agent._id,
  })

  return reply.status(200).send({
    deployments,
  })
}

export const deployAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { agentId } = request.params as AgentsDeployArguments
  const { platform, secrets, config } = request.body as AgentsDeployArguments

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!request.user.featureFlags.includes(FeatureFlag.Preview)) {
    return reply.status(401).send({
      error: 'You are not authorized to use this feature.',
    })
  }

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to deploy this agent',
    })
  }

  try {
    const configPayload: Record<string, any> = config
      ? JSON.parse(JSON.stringify(config))
      : {}
    const secretsPayload: Record<string, any> = secrets
      ? JSON.parse(JSON.stringify(secrets))
      : {}

    if (platform === 'email') {
      const emailDomain = await EmailDomain.findOne({ agent: agentId })

      if (!emailDomain) {
        return reply.status(400).send({
          error: 'Email domain has not been configured',
        })
      }

      if (emailDomain.status !== 'verified') {
        return reply.status(400).send({
          error: 'Email domain is not verified yet',
        })
      }

      const emailConfigInput = config?.email ?? {}

      configPayload.email = {
        domain_id: emailDomain._id.toString(),
        sender_email: emailConfigInput.sender_email,
        autoreply_enabled: emailConfigInput.autoreply_enabled ?? false,
        reply_delay_average_minutes:
          emailConfigInput.reply_delay_average_minutes ?? 0,
        reply_delay_variance_minutes:
          emailConfigInput.reply_delay_variance_minutes ?? 0,
      }

      secretsPayload.email = {
        domain: emailDomain.domain,
        provider_domain_id: emailDomain.provider_domain_id,
        inbound_route_id: emailDomain.inbound_route_id,
        inbound_route_expression: emailDomain.inbound_route_expression,
        forwarding_address: emailDomain.forwarding_address,
        webhook_signing_key:
          emailDomain.webhook_signing_key ||
          server.config.MAILGUN_WEBHOOK_SIGNING_KEY,
      }
    }

    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/create`,
      data: {
        agent: agentId,
        user: currentUserId,
        platform,
        secrets: secretsPayload,
        config: configPayload,
      },
    }

    const modalResponse = await axios.post(
      modalRequest.endpoint,
      modalRequest.data,
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    const deployment = modalResponse.data as AgentsDeployResponse

    if (platform === 'email') {
      await EmailDomain.updateOne(
        { agent: agentId },
        {
          $set: {
            deployment: new ObjectId(deployment.deployment_id),
          },
        },
      )
    }

    return reply.status(200).send({
      deploymentId: deployment.deployment_id,
    })
  } catch (error: any) {
    console.error(error)
    return reply.status(500).send({
      error:
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'An error occurred while deploying the agent',
    })
  }
}

export const updateAgentDeployment = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { agentId } = request.params as { agentId: string }
  const { platform, config, secrets } =
    request.body as AgentsUpdateDeploymentArguments

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to update this deployment',
    })
  }

  const deployment = await Deployment.findOne({
    agent: agentId,
    platform,
  })

  if (!deployment) {
    return reply.status(404).send({
      error: 'Deployment not found',
    })
  }

  if (deployment.agent.toString() !== agentId) {
    return reply.status(401).send({
      error: 'User not authorized to update this deployment',
    })
  }

  try {
    const configPayload: Record<string, any> = config
      ? JSON.parse(JSON.stringify(config))
      : {}
    const secretsPayload: Record<string, any> = secrets
      ? JSON.parse(JSON.stringify(secrets))
      : {}

    if (platform === 'email') {
      const emailDomain = await EmailDomain.findOne({ agent: agentId })

      if (!emailDomain) {
        return reply.status(400).send({
          error: 'Email domain has not been configured',
        })
      }

      if (emailDomain.status !== 'verified') {
        return reply.status(400).send({
          error: 'Email domain is not verified yet',
        })
      }

      const emailConfigInput = config?.email ?? {}

      configPayload.email = {
        domain_id: emailDomain._id.toString(),
        sender_email: emailConfigInput.sender_email,
        autoreply_enabled: emailConfigInput.autoreply_enabled ?? false,
        reply_delay_average_minutes:
          emailConfigInput.reply_delay_average_minutes ?? 0,
        reply_delay_variance_minutes:
          emailConfigInput.reply_delay_variance_minutes ?? 0,
      }

      secretsPayload.email = {
        domain: emailDomain.domain,
        provider_domain_id: emailDomain.provider_domain_id,
        inbound_route_id: emailDomain.inbound_route_id,
        inbound_route_expression: emailDomain.inbound_route_expression,
        forwarding_address: emailDomain.forwarding_address,
        webhook_signing_key:
          emailDomain.webhook_signing_key ||
          server.config.MAILGUN_WEBHOOK_SIGNING_KEY,
      }
    }

    // For Twitter only, update the deployment directly in MongoDB
    // Twitter doesn't have a workload running in the compute API
    if (platform === 'twitter') {
      const updateData: any = {}

      if (config) {
        // Deep merge the twitter config to preserve existing fields like username
        updateData.config = {
          ...deployment.config,
          twitter: {
            ...deployment.config?.twitter,
            ...configPayload.twitter,
          },
        }
      }

      if (secrets && Object.keys(secretsPayload).length > 0) {
        updateData.secrets = {
          ...deployment.secrets,
          ...secretsPayload,
        }
      }

      await Deployment.findByIdAndUpdate(deployment._id, updateData, {
        new: true,
      })

      return reply.status(200).send({
        deploymentId: deployment._id,
      })
    }

    // For all other platforms (including Farcaster), send to compute API
    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/update`,
      data: {
        deployment_id: deployment._id,
        config: configPayload,
        secrets: secretsPayload,
      },
    }

    await axios.post(modalRequest.endpoint, modalRequest.data, {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    })

    if (platform === 'email') {
      await EmailDomain.updateOne(
        { agent: agentId },
        {
          $set: {
            deployment: deployment._id,
          },
        },
      )
    }

    return reply.status(200).send({
      deploymentId: deployment._id,
    })
  } catch (error) {
    console.error(error)
    return reply.status(500).send({
      error: 'An error occurred while updating the deployment',
    })
  }
}

export const deleteAgentDeployment = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { agentId, platform } = request.params as AgentsStopDeploymentArguments

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to stop this deployment',
    })
  }

  // Find the deployment to get its ID for the v2 API
  const deployment = await Deployment.findOne({
    agent: agentId,
    platform,
  })

  if (!deployment) {
    return reply.status(404).send({
      error: 'Deployment not found',
    })
  }

  try {
    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/delete`,
      data: {
        deployment_id: deployment._id,
      },
    }

    const modalResponse = await axios.post(
      modalRequest.endpoint,
      modalRequest.data,
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    const response = modalResponse.data as AgentsStopDeploymentResponse

    if (platform === 'email') {
      const emailDomain = await EmailDomain.findOne({ agent: agentId })

      if (emailDomain) {
        try {
          await server.mailgun.deleteRoute(emailDomain.inbound_route_id)
        } catch (error: any) {
          server.log.error(
            { error },
            'Failed to delete email route from provider',
          )
        }

        try {
          await server.mailgun.deleteDomain(emailDomain.domain)
        } catch (error: any) {
          server.log.error(
            { error },
            'Failed to delete email domain from provider',
          )
        }

        await EmailDomain.deleteOne({ _id: emailDomain._id })
      }
    }

    return reply.status(200).send({
      success: response.success,
    })
  } catch (error) {
    console.error(error)
    return reply.status(500).send({
      error: 'An error occurred while stopping the deployment',
    })
  }
}

export const getAllUserTriggers = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  try {
    // Get all user's agents
    const agents = await Agent.find({
      owner: currentUserId,
      deleted: false,
    }).select('_id name username userImage')

    const agentIds = agents.map(agent => agent._id)

    if (agentIds.length === 0) {
      return reply.status(200).send({
        triggers: [],
      })
    }

    type TriggerWithAgent = typeof Trigger & {
      agent: {
        _id: string
        name: string
        username: string
        userImage: string
      }
    }

    // Get all triggers for user's agents
    const triggers = (await Trigger.find({
      agent: { $in: agentIds },
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
    }).populate({
      path: 'agent',
      select: '_id name username userImage',
      model: Agent,
    })) as TriggerWithAgent[]

    // Force cloudfront URLs for agent images
    triggers.forEach(trigger => {
      if (trigger.agent && trigger.agent.userImage) {
        trigger.agent.userImage = forceCloudfrontUrl(
          server,
          trigger.agent.userImage,
        )
      }
    })

    return reply.status(200).send({
      triggers,
    })
  } catch (error) {
    console.error('Error getting user triggers:', error)
    return reply.status(500).send({
      error: 'Failed to get user triggers',
    })
  }
}

export const getAllUserDeployments = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  try {
    // Get all user's agents
    const agents = await Agent.find({
      owner: currentUserId,
      deleted: false,
    }).select('_id name username userImage')

    const agentIds = agents.map(agent => agent._id)

    if (agentIds.length === 0) {
      return reply.status(200).send({
        deployments: [],
      })
    }

    type DeploymentWithAgent = typeof Deployment & {
      agent: {
        _id: string
        name: string
        username: string
        userImage: string
      }
    }

    // Get all deployments for user's agents
    const deployments = (await Deployment.find({
      agent: { $in: agentIds },
    }).populate({
      path: 'agent',
      select: '_id name username userImage',
      model: Agent,
    })) as DeploymentWithAgent[]

    // Force cloudfront URLs for agent images
    deployments.forEach(deployment => {
      if (deployment.agent && deployment.agent.userImage) {
        deployment.agent.userImage = forceCloudfrontUrl(
          server,
          deployment.agent.userImage,
        )
      }
    })

    return reply.status(200).send({
      deployments,
    })
  } catch (error) {
    console.error('Error getting user deployments:', error)
    return reply.status(500).send({
      error: 'Failed to get user deployments',
    })
  }
}

// Get dashboard data for an agent
export const getDashboardData = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const userId = request.user?.userId
  const { startDate, endDate } = request.query as {
    startDate?: string
    endDate?: string
  }

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    // Validate agent access
    const { agent, error } = await validateAgentAccess(agentId)
    if (error || !agent) {
      return reply.status(404).send({ error })
    }

    // Check if user has edit access (using same permission logic as memory endpoints)
    const isOwner = await hasOwnerPermissions(agentId, userId.toString())

    const hasPermission = await AgentPermission.findOne({
      agent: agentId,
      user: userId,
      level: { $in: [AgentPermissionLevel.Owner, AgentPermissionLevel.Editor] },
    })

    const hasEditAccess = isOwner || !!hasPermission

    if (!hasEditAccess) {
      return reply.status(403).send({
        error:
          'You do not have permission to view dashboard data for this agent',
      })
    }

    // Default date range: last 30 days
    const now = new Date()
    const start = startDate
      ? (() => {
          const startDateObj = new Date(startDate)
          // Set to start of day to include all messages from that day
          startDateObj.setHours(0, 0, 0, 0)
          return startDateObj
        })()
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate
      ? (() => {
          const endDateObj = new Date(endDate)
          // Set to end of day to include all messages from that day
          endDateObj.setHours(23, 59, 59, 999)
          return endDateObj
        })()
      : now

    // Convert agentId to ObjectId for query
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    // First, get all sessions that contain this agent within the date range
    const sessionsWithAgent = await Session.find({
      agents: agentObjectId,
      updatedAt: { $gte: start },
      createdAt: { $lte: end },
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
    }).select('_id platform')

    if (sessionsWithAgent.length === 0) {
      return reply.status(200).send({
        messageActivity: [],
        userStats: [],
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        },
        platforms: ['web'],
      })
    }

    // Extract session IDs and create a platform map
    const sessionIds = sessionsWithAgent.map(s => s._id)
    const sessionPlatformMap = new Map()
    sessionsWithAgent.forEach(s => {
      sessionPlatformMap.set(s._id.toString(), s.platform || 'web')
    })

    // Now query messages collection directly by session field
    const results = await Message.aggregate([
      // Stage 1: Match messages from sessions containing the agent
      {
        $match: {
          session: { $in: sessionIds },
          createdAt: { $gte: start, $lte: end },
        },
      },
      // Stage 2: Lookup usernames for message senders
      {
        $lookup: {
          from: 'users3',
          localField: 'sender',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                username: 1,
              },
            },
          ],
          as: 'senderData',
        },
      },
      // Stage 3: Project final structure with character count calculation
      {
        $project: {
          _id: 1,
          session: 1,
          sender: 1,
          role: { $ifNull: ['$role', '$name', 'unknown'] },
          username: {
            $ifNull: [{ $arrayElemAt: ['$senderData.username', 0] }, 'unknown'],
          },
          timestamp: '$createdAt',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          charCount: {
            $cond: {
              if: {
                $and: [{ $ne: ['$content', null] }, { $ne: ['$content', ''] }],
              },
              then: { $strLenCP: '$content' },
              else: 0,
            },
          },
        },
      },
    ])

    if (results.length === 0) {
      return reply.status(200).send({
        messageActivity: [],
        userStats: [],
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        },
        platforms: ['web'],
      })
    }

    // Convert aggregation results to messageDataList format
    const messageDataList = results.map(result => ({
      _id: result._id.toString(),
      platform: sessionPlatformMap.get(result.session.toString()) || 'web',
      role: result.role,
      username: result.username,
      timestamp: result.timestamp || new Date(),
      date: result.date,
      sender: result.sender.toString(),
      charCount: result.charCount || 0,
    }))

    // Calculate activity metadata for smart date range selection
    let oldestMessageDate: Date | null = null
    let newestMessageDate: Date | null = null

    if (messageDataList.length > 0) {
      const dates = messageDataList.map(m => new Date(m.timestamp))
      oldestMessageDate = new Date(Math.min(...dates.map(d => d.getTime())))
      newestMessageDate = new Date(Math.max(...dates.map(d => d.getTime())))
    }

    // Process data for bar chart (messages by date and platform)
    const messagesByDatePlatform = new Map()
    const userMessageCounts = new Map()
    const userTokenCounts = new Map()
    const platforms = new Set() // Don't pre-populate, let data drive platform detection
    const roles = new Set()

    messageDataList.forEach(message => {
      const { date, platform, role, username, charCount } = message

      // Track platforms and roles
      platforms.add(platform)
      roles.add(role)

      // Count messages and tokens by date and platform
      const key = `${date}-${platform}`
      if (!messagesByDatePlatform.has(key)) {
        messagesByDatePlatform.set(key, {
          date,
          platform,
          count: 0,
          tokenCount: 0,
        })
      }
      const entry = messagesByDatePlatform.get(key)
      entry.count++
      const tokensForMessage = Math.ceil(charCount / 4.5)
      entry.tokenCount += tokensForMessage

      // Count messages and tokens by username for pie chart (only user messages)
      if (role === 'user') {
        const currentUserMessages = userMessageCounts.get(username) || 0
        const currentUserTokens = userTokenCounts.get(username) || 0
        const tokensForUserMessage = Math.ceil(charCount / 4.5)

        userMessageCounts.set(username, currentUserMessages + 1)
        userTokenCounts.set(username, currentUserTokens + tokensForUserMessage)
      }
    })

    // Generate complete date range for bar chart
    const dateRange = []
    const currentDate = new Date(start)
    const endDateObj = new Date(end)

    while (currentDate <= endDateObj) {
      dateRange.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Use the platforms actually found in the data, fallback to ['web']
    let platformArray = Array.from(platforms)
    if (platformArray.length === 0) {
      platformArray = ['web']
    }

    // Fill in missing date/platform combinations with zero values for bar chart
    const messageActivity = []

    for (const date of dateRange) {
      for (const platform of platformArray) {
        const key = `${date}-${platform}`
        const existing = messagesByDatePlatform.get(key)
        messageActivity.push({
          date,
          platform,
          messageCount: existing?.count || 0,
          tokenCount: existing?.tokenCount || 0,
        })
      }
    }

    // Convert user message counts to array format for pie chart
    const userStats = Array.from(userMessageCounts.entries())
      .map(([username, messageCount]) => ({
        username,
        messageCount,
        tokenCount: userTokenCounts.get(username) || 0,
      }))
      .sort((a, b) => b.messageCount - a.messageCount) // Sort by message count descending

    // For backward compatibility, also create sessionActivity with the old format
    // This aggregates messages back to the session level for existing frontend code
    const sessionActivityMap = new Map()
    messageDataList.forEach(message => {
      const key = `${message.date}-${message.platform}`
      if (!sessionActivityMap.has(key)) {
        sessionActivityMap.set(key, {
          date: message.date,
          platform: message.platform,
          totalUserMessages: 0,
          sessionCount: 0,
        })
      }
      if (message.role === 'user') {
        sessionActivityMap.get(key).totalUserMessages++
      }
    })

    // Fill in missing dates for sessionActivity (backward compatibility)
    const sessionActivity = []
    for (const date of dateRange) {
      for (const platform of platformArray) {
        const key = `${date}-${platform}`
        const existing = sessionActivityMap.get(key)
        sessionActivity.push({
          date,
          platform,
          totalUserMessages: existing?.totalUserMessages || 0,
          sessionCount: existing?.sessionCount || 0,
        })
      }
    }

    const responseData = {
      // Backward compatibility fields
      sessionActivity, // Old format for existing frontend
      // New enhanced data
      messageActivity, // New format showing all messages by actual timestamp
      userStats, // Pie chart data for user message counts
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      platforms: platformArray,
      roles: Array.from(roles),
      // Activity metadata for smart date range selection (performance optimized)
      activityMetadata: {
        oldestMessageDate: oldestMessageDate?.toISOString(),
        newestMessageDate: newestMessageDate?.toISOString(),
        totalMessages: messageDataList.length,
        hasRecentActivityOnly: oldestMessageDate
          ? Date.now() - oldestMessageDate.getTime() <= 7 * 24 * 60 * 60 * 1000
          : false,
      },
    }

    return reply.status(200).send(responseData)
  } catch (error) {
    server.log.error({ err: error }, 'Error fetching dashboard data:')
    return reply.status(500).send({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
