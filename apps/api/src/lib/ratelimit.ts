import { TaskV2 } from '../models/v2/TaskV2'
import { eden2EarlyAccessCheck } from './authorization'
import {
  GeneratorOutputTypeV2,
  SubscriptionTier,
  TaskV2Status,
} from '@edenlabs/eden-sdk'
import { FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

type TaskRateLimit = {
  image: number
  video: number
}

const maximumTasksConcurrencyMap: Record<SubscriptionTier, TaskRateLimit> = {
  [SubscriptionTier.Free]: {
    image: 4,
    video: 2,
  },
  [SubscriptionTier.Basic]: {
    image: 8,
    video: 4,
  },
  [SubscriptionTier.Pro]: {
    image: 16,
    video: 8,
  },
  [SubscriptionTier.Believer]: {
    image: 24,
    video: 12,
  },
}

const maximumTasksPerHourMap: Record<SubscriptionTier, TaskRateLimit> = {
  [SubscriptionTier.Free]: {
    image: 150,
    video: 15,
  },
  [SubscriptionTier.Basic]: {
    image: 600,
    video: 60,
  },
  [SubscriptionTier.Pro]: {
    image: 1200,
    video: 120,
  },
  [SubscriptionTier.Believer]: {
    image: 1800,
    video: 180,
  },
}

const maximumTasksPerMinuteMap: Record<SubscriptionTier, TaskRateLimit> = {
  [SubscriptionTier.Free]: {
    image: 20,
    video: 2,
  },
  [SubscriptionTier.Basic]: {
    image: 80,
    video: 8,
  },
  [SubscriptionTier.Pro]: {
    image: 160,
    video: 16,
  },
  [SubscriptionTier.Believer]: {
    image: 240,
    video: 24,
  },
}

export const subscriptionTierNameMap: Record<SubscriptionTier, string> = {
  [SubscriptionTier.Free]: 'Free',
  [SubscriptionTier.Basic]: 'Basic',
  [SubscriptionTier.Pro]: 'Pro',
  [SubscriptionTier.Believer]: 'Believer',
}

type TaskRateLimitCheckResult = {
  status: 'ok' | 'error'
  message?: string
}

// Helper function to get maximum tasks for given subscription tier and output type
const getMaximumTasks = (
  map: Record<SubscriptionTier, TaskRateLimit>,
  subscriptionTier: SubscriptionTier | undefined,
  outputType: GeneratorOutputTypeV2,
): number => {
  const tier = subscriptionTier || SubscriptionTier.Free
  const type = outputType === 'image' ? 'image' : 'video'
  return map[tier][type]
}

// Helper function to find tasks created since a given timeframe
const getTasksCount = async (
  userId: ObjectId | undefined,
  since: Date,
  status: TaskV2Status[] = [],
  outputType: GeneratorOutputTypeV2 | undefined,
) => {
  const query: {
    user?: ObjectId
    status?: { $in: TaskV2Status[] }
    createdAt?: { $gte: Date }
    output_type?: GeneratorOutputTypeV2
  } = {
    user: userId,
    createdAt: { $gte: since },
  }

  if (status) {
    query.status = { $in: status }
  }

  if (outputType) {
    query.output_type = outputType
  }

  return TaskV2.countDocuments(query)
}

export const taskRateLimitCheck = async (
  request: FastifyRequest,
  outputType: GeneratorOutputTypeV2,
): Promise<TaskRateLimitCheckResult> => {
  const { userId, subscriptionTier } = request.user
  const type = outputType === 'image' ? 'image' : 'video'

  const hasEarlyAccess = eden2EarlyAccessCheck(request)
  if (!hasEarlyAccess) {
    return {
      status: 'error',
      message: 'Account has no early access permission',
    }
  }

  const maximumTasksConcurrency = getMaximumTasks(
    maximumTasksConcurrencyMap,
    subscriptionTier,
    type,
  )
  const maximumTasksPerMinute = getMaximumTasks(
    maximumTasksPerMinuteMap,
    subscriptionTier,
    type,
  )
  const maximumTasksPerHour = getMaximumTasks(
    maximumTasksPerHourMap,
    subscriptionTier,
    type,
  )

  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)
  const numTasksInProgress = await getTasksCount(
    userId,
    oneHourAgo,
    [TaskV2Status.Pending, TaskV2Status.Running],
    type,
  )

  const subscriptionTierName =
    subscriptionTierNameMap[
      (subscriptionTier || SubscriptionTier.Free) as SubscriptionTier
    ]
  if (numTasksInProgress >= maximumTasksConcurrency) {
    return {
      status: 'error',
      message: `Concurrency limit for '${outputType}' reached! Max. ${maximumTasksConcurrency} on '${subscriptionTierName}' plan. Wait for some tasks to finish.`,
    }
  }
  const oneMinuteAgo = new Date(Date.now() - 60000)
  const numTasksCreatedLastMinute = await getTasksCount(
    userId,
    oneMinuteAgo,
    [
      TaskV2Status.Pending,
      TaskV2Status.Running,
      TaskV2Status.Completed,
      TaskV2Status.Cancelled,
    ],
    type,
  )
  if (numTasksCreatedLastMinute >= maximumTasksPerMinute) {
    return {
      status: 'error',
      message: `Rate limit for '${outputType}' reached! Max. ${maximumTasksPerMinute} per minute on '${subscriptionTierName}' plan. Try again later.`,
    }
  }

  const numTasksCreatedLastHour = await getTasksCount(
    userId,
    oneHourAgo,
    [
      TaskV2Status.Pending,
      TaskV2Status.Running,
      TaskV2Status.Completed,
      TaskV2Status.Cancelled,
    ],
    type,
  )
  if (numTasksCreatedLastHour >= maximumTasksPerHour) {
    return {
      status: 'error',
      message: `Rate limit for '${outputType}' reached! Max. ${maximumTasksPerHour} per hour on '${subscriptionTierName}' plan. Try again later.`,
    }
  }
  return { status: 'ok' }
}
