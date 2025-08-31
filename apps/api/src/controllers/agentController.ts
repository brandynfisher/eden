import { Agent, AgentDocument } from '../models/Agent'
import { AgentPermission, PermissionLevel } from '../models/AgentPermission'
import { Deployment } from '../models/Deployment'
import { Notification } from '../models/Notification'
import { User } from '../models/User'
import { CreationV2 } from '../models/v2/CreationV2'
import { LikeV2 } from '../models/v2/LikeV2'
import { ModelV2 } from '../models/v2/ModelV2'
import { forceCloudfrontUrl, s3ThumbnailUrl, s3Url } from '../plugins/s3Plugin'
import AgentRepository from '../repositories/AgentRepository'
import { generateBlurhash } from '../utils/blurhash'
import { createIdOrSlugQuery, createMultiFieldQuery } from '../utils/mongoUtils'
import {
  createMemoryAgent as _createMemoryAgent,
  getAgentMemory as _getAgentMemory,
  removeMemoryFromAgent as _removeMemoryFromAgent,
  removeUnabsorbedMemory as _removeUnabsorbedMemory,
  retrieveMemoryAgent as _retrieveMemoryAgent,
  retrieveMemorySession as _retrieveMemorySession,
  retrieveMemoryUser as _retrieveMemoryUser,
  saveAgentMemory as _saveAgentMemory,
  updateMemoryAgent as _updateMemoryAgent,
  updateMemorySession as _updateMemorySession,
  updateMemoryUser as _updateMemoryUser,
  updateUserMemoryEnabled as _updateUserMemoryEnabled,
} from './agentMemoryController'
// Import functions from specialized controllers for re-export
import {
  createAgentTrigger as _createAgentTrigger,
  deleteAgentDeployment as _deleteAgentDeployment,
  deleteAgentTrigger as _deleteAgentTrigger,
  deployAgent as _deployAgent,
  executeAgentTrigger as _executeAgentTrigger,
  getAgentDeployments as _getAgentDeployments,
  getAgentTriggers as _getAgentTriggers,
  getAllUserDeployments as _getAllUserDeployments,
  getAllUserTriggers as _getAllUserTriggers,
  getDashboardData as _getDashboardData,
  updateAgentDeployment as _updateAgentDeployment,
  updateAgentTrigger as _updateAgentTrigger,
} from './agentServicesController'
import {
  AgentGetArguments,
  AgentsCreateArguments,
  AgentsDeleteArguments,
  AgentsUpdateArguments,
  FeatureFlag,
  SubscriptionTier,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { UpdateResult } from 'mongodb'
import { UpdateQuery } from 'mongoose'

// Re-export functions from agentServicesController
export {
  _getAgentTriggers as getAgentTriggers,
  _createAgentTrigger as createAgentTrigger,
  _updateAgentTrigger as updateAgentTrigger,
  _deleteAgentTrigger as deleteAgentTrigger,
  _executeAgentTrigger as executeAgentTrigger,
  _getAgentDeployments as getAgentDeployments,
  _deployAgent as deployAgent,
  _updateAgentDeployment as updateAgentDeployment,
  _deleteAgentDeployment as deleteAgentDeployment,
  _getAllUserTriggers as getAllUserTriggers,
  _getAllUserDeployments as getAllUserDeployments,
  _getDashboardData as getDashboardData,
}

// Re-export functions from agentMemoryController
export {
  _getAgentMemory as getAgentMemory,
  _saveAgentMemory as saveAgentMemory,
  _retrieveMemoryUser as retrieveMemoryUser,
  _retrieveMemoryAgent as retrieveMemoryAgent,
  _updateMemoryAgent as updateMemoryAgent,
  _removeMemoryFromAgent as removeMemoryFromAgent,
  _retrieveMemorySession as retrieveMemorySession,
  _updateMemoryUser as updateMemoryUser,
  _updateMemorySession as updateMemorySession,
  _removeUnabsorbedMemory as removeUnabsorbedMemory,
  _createMemoryAgent as createMemoryAgent,
  _updateUserMemoryEnabled as updateUserMemoryEnabled,
}

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
    level: PermissionLevel.Owner,
  })

  return !!permission
}

export const getAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as AgentGetArguments
  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent || agent.deleted) {
    return reply.status(404).send({ error: 'Agent not found' })
  }

  const currentUserId = request.user ? request.user.userId : undefined
  const isOwnAgent =
    currentUserId && agent.owner.toString() === currentUserId.toString()

  const agentRepository = new AgentRepository(Agent)

  await Promise.all([
    agentRepository.model.populate(agent, {
      path: 'owner',
      select: '_id userId username userImage',
    }),
    isOwnAgent && agent.deployments && agent.deployments.length > 0
      ? agentRepository.model.populate(agent, {
          path: 'deployments',
          select: '_id platform',
          model: Deployment,
        })
      : Promise.resolve(),
    // No longer needed - permissions are in separate collection
  ])

  if (agent.userImage) {
    agent.userImage = forceCloudfrontUrl(server, agent.userImage)
  }

  if (agent.owner.userImage) {
    agent.owner.userImage = forceCloudfrontUrl(server, agent.owner.userImage)
  }

  // Check if user has liked this agent
  if (currentUserId) {
    const userLike = await LikeV2.findOne({
      user: currentUserId,
      entityType: 'agent',
      entityId: agent._id,
    })
    agent.isLiked = !!userLike
  }

  // Get permissions if user is owner
  if (isOwnAgent) {
    const permissions = await AgentPermission.find({
      agent: agent._id,
    }).populate('user', '_id userId username userImage')

    // Attach permissions to response
    ;(agent as any).permissions = permissions
  }

  return reply.status(200).send({ agent })
}

export const createAgent = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const {
    name,
    key,
    description,
    image,
    models,
    persona,
    isPersonaPublic,
    greeting,
    knowledge,
    suggestions,
    voice,
    tools,
    llm_settings,
  } = request.body as AgentsCreateArguments

  const currentUserId = request.user.userId

  if (models && models.length > 10) {
    return reply.status(422).send({
      error: 'Cannot have more than 10 models',
    })
  }

  // Verify access to all models if provided
  if (models && models.length > 0) {
    for (const model of models) {
      await verifyModelAccess(reply, model.lora, currentUserId.toString())
    }
  }

  const imageFilename = image.split('/').pop()

  const agent = new Agent({
    type: 'agent',
    owner: currentUserId,
    username: key,
    name: name,
    userImage: imageFilename,
    description,
    persona,
    isPersonaPublic,
    greeting,
    knowledge,
    suggestions,
    voice,
    models: models || [],
    tools,
    llm_settings: llm_settings,
    featureFlags: [FeatureFlag.FreeTools],
  })

  try {
    await agent.save()
  } catch (error) {
    // @ts-ignore
    if (error.code === 11000) {
      return reply.status(409).send({
        error: 'An agent with this key already exists',
      })
    }

    return reply.status(500).send({
      error: 'An error occurred while creating the agent',
    })
  }

  return reply.status(200).send({ agentId: agent._id })
}

export const updateAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  const { agentId } = request.params as AgentsUpdateArguments
  const {
    name,
    key,
    description,
    persona,
    isPersonaPublic,
    greeting,
    knowledge,
    suggestions,
    image,
    voice,
    models,
    public: isPublic,
    owner_pays,
    tools,
    llm_settings,
  } = request.body as AgentsUpdateArguments

  if (models && models.length > 10) {
    return reply.status(422).send({
      error: 'Cannot have more than 10 models',
    })
  }

  if (!agentId) {
    return reply.status(422).send({
      error: 'Missing agentId',
    })
  }

  if (isPublic === false) {
    const user = request.user
    if (user.subscriptionTier === SubscriptionTier.Free) {
      return reply.status(401).send({
        error: 'You are not authorized to make an agent private',
      })
    }
  }

  const query = createIdOrSlugQuery(agentId)

  const updateData: UpdateQuery<AgentDocument> = {
    username: key,
    name: name,
    description,
    persona,
    isPersonaPublic,
    greeting,
    knowledge,
    suggestions,
    voice,
    public: isPublic,
    owner_pays,
    tools,
    llm_settings: llm_settings,
  }

  console.log('UPDATE AGENT - updateData:', JSON.stringify(updateData, null, 2))

  // Handle models array
  if (!models || models.length === 0) {
    updateData.$unset = { models: 1 }
  } else {
    // Verify access to all models
    for (const model of models) {
      await verifyModelAccess(reply, model.lora, currentUserId.toString())
    }
    updateData.models = models
  }

  // Only update image fields if image is explicitly provided in the request
  if (image !== undefined) {
    if (!image || image === '') {
      updateData.userImage = null
      updateData.blurhash = null
    } else if (image.startsWith('http')) {
      // This is a new uploaded image URL - process it
      const blurhash = await generateBlurhash(server, image)
      const imageFilename = image.split('/').pop()

      updateData.userImage = imageFilename
      updateData.blurhash = blurhash
    }
    // If image is just a filename (existing image), don't update image fields
  }

  let result: UpdateResult
  // Check if user is owner or editor
  const agentToCheck = await Agent.findOne({
    ...query,
    deleted: false,
  })

  if (!agentToCheck) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  const isOriginalOwner =
    agentToCheck.owner.toString() === currentUserId.toString()

  // Check new permissions system
  let hasPermission = isOriginalOwner
  if (!hasPermission) {
    const permission = await AgentPermission.findOne({
      agent: agentId,
      user: currentUserId,
    })
    hasPermission = !!permission
  }

  if (!hasPermission) {
    return reply.status(401).send({
      error: 'You are not authorized to update this agent',
    })
  }

  updateData.user_memory_enabled = agentToCheck.user_memory_enabled

  try {
    result = await Agent.updateOne(
      {
        ...query,
        deleted: false,
      },
      updateData,
    )
  } catch (error) {
    // @ts-ignore
    if (error.code === 11000) {
      return reply.status(409).send({
        error: 'An agent with this key already exists',
      })
    }

    return reply.status(500).send({
      error: 'An error occurred while updating the agent',
    })
  }

  if (!result.matchedCount) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  return reply.status(200).send({
    agentId,
  })
}

export const deleteAgent = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  const { agentId } = request.params as AgentsDeleteArguments

  const agent = await Agent.findOne({
    _id: agentId,
  })

  if (!agent || agent.deleted) {
    return reply.status(404).send({
      message: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      message: 'User not authorized to delete this',
    })
  }

  await agent.delete()

  return reply.status(200).send()
}

const verifyModelAccess = async (
  reply: FastifyReply,
  modelId: string,
  currentUserId: string,
) => {
  const model = await ModelV2.findById(modelId)

  if (!model || model.deleted) {
    return reply.status(404).send({
      error: 'Model not found',
    })
  }

  const isOwnModel = model.user.toString() === currentUserId.toString()
  if (!isOwnModel && !model.public) {
    return reply.status(401).send({
      error: 'You are not authorized to use this model',
    })
  }
}

export const likeAgent = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { agentId } = request.params as { agentId: string }

  if (!agentId) {
    return reply.status(422).send({
      message: 'Agent ID is required',
    })
  }

  try {
    // Check if the agent exists and user has access to it
    const agent = await Agent.findOne({
      _id: agentId,
      deleted: false,
      $or: [{ public: true }, { owner: userId }],
    })

    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found or you do not have access to it',
      })
    }

    // Check if user has already liked this agent
    const existingLike = await LikeV2.findOne({
      user: userId,
      entityType: 'agent',
      entityId: agentId,
    })

    if (existingLike) {
      return reply.status(400).send({
        message: 'Agent already liked by user',
      })
    }

    // Create the like
    await LikeV2.create({
      user: userId,
      entityType: 'agent',
      entityId: agentId,
    })

    // Increment the like count
    await Agent.findByIdAndUpdate(agentId, {
      $inc: { likeCount: 1 },
    })

    return reply.status(200).send({
      message: 'Agent liked successfully',
    })
  } catch (error) {
    console.error('Error liking agent:', error)
    return reply.status(500).send({
      message: 'Error liking agent',
    })
  }
}

export const unlikeAgent = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { agentId } = request.params as { agentId: string }

  if (!agentId) {
    return reply.status(422).send({
      message: 'Agent ID is required',
    })
  }

  try {
    // Check if the agent exists and user has access to it
    const agent = await Agent.findOne({
      _id: agentId,
      deleted: false,
      $or: [{ public: true }, { owner: userId }],
    })

    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found or you do not have access to it',
      })
    }

    // Check if the like exists
    const like = await LikeV2.findOne({
      user: userId,
      entityType: 'agent',
      entityId: agentId,
    })

    if (!like) {
      return reply.status(404).send({
        message: 'Like not found',
      })
    }

    // Delete the like
    await LikeV2.findByIdAndDelete(like._id)

    // Decrement the like count
    if (agent.likeCount && agent.likeCount > 0) {
      await Agent.findByIdAndUpdate(agentId, {
        $inc: { likeCount: -1 },
      })
    }

    return reply.status(200).send({
      message: 'Agent unliked successfully',
    })
  } catch (error) {
    console.error('Error unliking agent:', error)
    return reply.status(500).send({
      message: 'Error unliking agent',
    })
  }
}

// Get agent permissions
export const getAgentPermissions = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }

  const agent = await Agent.findById(agentId)
  if (!agent || agent.deleted) {
    return reply.status(404).send({ error: 'Agent not found' })
  }

  // Anyone can view agent permissions for transparency

  const permissions = await AgentPermission.find({ agent: agentId }).populate(
    'user',
    '_id userId username userImage',
  )

  return reply.status(200).send({ permissions })
}

// ========================= Creations Listing =========================
// Returns creations for an agent consisting of:
// 1. All creations created by the authenticated user for this agent (any visibility, not deleted)
// 2. All public creations for this agent created by other users (public=true, not deleted)
// Results are sorted by createdAt desc / _id desc for stable pagination.
// Supports cursor based pagination using ?cursor=<creationId>&limit=<n>
// If no auth user provided returns only public creations for the agent.
export const getAgentCreations = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { agentId } = request.params as { agentId: string }
    const { limit = 50, cursor } = request.query as {
      limit?: number | string
      cursor?: string
    }

    // -------- Parameter validation --------
    const parsedLimit = Number(limit)
    if (Number.isNaN(parsedLimit) || !Number.isInteger(parsedLimit)) {
      return reply
        .status(400)
        .send({ message: 'Invalid limit parameter (must be integer)' })
    }
    if (parsedLimit < 1 || parsedLimit > 100) {
      return reply.status(400).send({
        message: 'Invalid limit parameter (must be between 1 and 100)',
      })
    }

    let cursorObjectId: any = null
    if (cursor) {
      if (!server.mongoose.isObjectIdOrHexString(cursor)) {
        return reply
          .status(400)
          .send({ message: 'Invalid cursor parameter (must be a valid id)' })
      }
      cursorObjectId = new server.mongoose.Types.ObjectId(cursor)
    }

    // Validate / locate agent (by id or slug)
    const query = createIdOrSlugQuery(agentId)
    const agent = await Agent.findOne(query).select('_id deleted owner public')
    if (!agent || agent.deleted) {
      return reply.status(404).send({ message: 'Agent not found' })
    }

    const authUserId = request.user?.userId

    // Access control for private agents
    if (agent.public === false) {
      if (!authUserId) {
        return reply.status(401).send({
          message: 'Authentication required to view private agent creations',
        })
      }
      const isOwner =
        agent.owner && agent.owner.toString() === authUserId.toString()
      if (!isOwner) {
        return reply.status(403).send({
          message:
            "Forbidden: you do not have access to this agent's private creations",
        })
      }
    }

    // Build match conditions
    const match: any = {
      agent: agent._id,
      deleted: false,
      ...(cursorObjectId ? { _id: { $lt: cursorObjectId } } : {}),
    }

    if (!authUserId) {
      // Unauthenticated users only see public creations
      match.public = true
    } else {
      // User gets their own (any visibility) + public from others
      match.$or = [{ user: authUserId }, { public: true }]
    }

    // Get total count of matching creations (for pagination UI)
    const totalDocs = await CreationV2.countDocuments(match)

    const docs = await CreationV2.find(match)
      .sort({ _id: -1 })
      .limit(parsedLimit)
      .populate({
        path: 'user',
        select: '_id userId username userImage type',
        model: 'users3',
      })
      .populate({ path: 'agent', select: '_id username name userImage type' })
      .populate({ path: 'task', select: '_id args' })

    // Enrich like state if authenticated
    if (authUserId && docs.length) {
      const creationIds = docs.map(d => d._id)
      const likes = await LikeV2.find({
        user: authUserId,
        entityType: 'creation',
        entityId: { $in: creationIds },
      }).select('entityId')
      const likedSet = new Set(likes.map(l => l.entityId.toString()))
      docs.forEach(d => {
        d.isLiked = likedSet.has(d._id.toString())
      })
    }

    // Attach URLs & thumbnails
    docs.forEach(doc => {
      // @ts-ignore
      doc.url = s3Url(server, doc.filename || '')
      // @ts-ignore
      doc.thumbnail = s3ThumbnailUrl(server, doc.filename || '', 512)
      // @ts-ignore
      if (doc.user?.userImage) {
        // @ts-ignore
        doc.user.userImage = forceCloudfrontUrl(server, doc.user.userImage)
      }
    })

    const nextCursor = docs.length ? docs[docs.length - 1]._id : undefined

    return reply.status(200).send({
      docs,
      nextCursor,
      totalDocs,
    })
  } catch (error) {
    server.log.error('Error fetching agent creations', error)
    if ((error as any).name === 'CastError') {
      return reply.status(400).send({ message: 'Invalid parameter format' })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}

// Update agent permissions
export const updateAgentPermissions = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const { permissions } = request.body as {
    permissions: Array<{ username: string; level: 'editor' | 'owner' }>
  }
  const currentUserId = request.user.userId

  const agent = await Agent.findById(agentId)
  if (!agent || agent.deleted) {
    return reply.status(404).send({ error: 'Agent not found' })
  }

  // Only owner can modify permissions
  if (!(await hasOwnerPermissions(agentId, currentUserId.toString()))) {
    return reply.status(401).send({
      error: 'Only agent owners can modify permissions',
    })
  }

  try {
    // Get existing permissions for notification comparison
    const existingPermissions = await AgentPermission.find({
      agent: agentId,
    }).populate('user', 'username')

    const existingUserMap = new Map(
      existingPermissions.map(p => [(p.user as any).username, p.level]),
    )

    // Delete existing permissions
    await AgentPermission.deleteMany({ agent: agentId })

    const newPermissions = []

    // Add new permissions and track changes for notifications
    for (const perm of permissions) {
      const query = createMultiFieldQuery(perm.username, ['userId', 'username'])
      const user = await User.findOne(query)

      if (!user) {
        return reply.status(404).send({
          error: `User not found: ${perm.username}`,
        })
      }

      const newPermission = await AgentPermission.create({
        agent: agentId,
        user: user._id,
        level:
          perm.level === 'owner'
            ? PermissionLevel.Owner
            : PermissionLevel.Editor,
        grantedBy: currentUserId,
        grantedAt: new Date(),
      })

      newPermissions.push({
        permission: newPermission,
        user,
        username: perm.username,
        level: perm.level,
      })

      // Check if this is a new permission or changed level
      const existingLevel = existingUserMap.get(perm.username)
      if (!existingLevel) {
        // New permission - send notification
        await Notification.create({
          user: user._id,
          type: 'agent_permission_added',
          title: 'Agent Permission Added',
          message: `You've been granted ${perm.level} access to the agent "${agent.name}".`,
          priority: 'normal',
          agent: agentId,
          action_url: `/chat/${agent.username}`,
          channels: ['in_app'],
        })
      } else if (
        existingLevel !==
        (perm.level === 'owner'
          ? PermissionLevel.Owner
          : PermissionLevel.Editor)
      ) {
        // Permission level changed - send notification
        await Notification.create({
          user: user._id,
          type: 'agent_permission_added',
          title: 'Agent Permission Updated',
          message: `Your access to the agent "${agent.name}" has been changed to ${perm.level}.`,
          priority: 'normal',
          agent: agentId,
          action_url: `/chat/${agent.username}`,
          channels: ['in_app'],
        })
      }
    }

    // Check for removed permissions and send notifications
    const newUserMap = new Map(newPermissions.map(p => [p.username, p.level]))

    for (const [username, _] of existingUserMap) {
      if (!newUserMap.has(username)) {
        // Permission was removed - send notification
        const removedUser = await User.findOne(
          createMultiFieldQuery(username, ['userId', 'username']),
        )
        if (removedUser) {
          await Notification.create({
            user: removedUser._id,
            type: 'agent_permission_removed',
            title: 'Agent Permission Removed',
            message: `Your access to the agent "${agent.name}" has been removed.`,
            priority: 'normal',
            agent: agentId,
            action_url: `/chat/${agent.username}`,
            channels: ['in_app'],
          })
        }
      }
    }

    return reply.status(200).send({ success: true })
  } catch (error) {
    console.error('Error updating permissions:', error)
    return reply.status(500).send({
      error: 'Failed to update permissions',
    })
  }
}

// Get agents shared with user
export const getSharedAgents = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  try {
    // Find all permissions for this user
    const permissions = await AgentPermission.find({
      user: currentUserId,
    }).populate({
      path: 'agent',
      match: { deleted: false },
      populate: {
        path: 'owner',
        select: '_id userId username userImage',
      },
    })

    // Filter out null agents (deleted ones)
    const sharedAgents = permissions
      .filter(p => p.agent)
      .map(p => ({
        agent: p.agent,
        permissionLevel: p.level,
        grantedAt: p.grantedAt,
      }))

    // Process agent images
    sharedAgents.forEach(item => {
      const agent = item.agent as any
      if (agent.userImage) {
        agent.userImage = forceCloudfrontUrl(server, agent.userImage)
      }
      if (agent.owner?.userImage) {
        agent.owner.userImage = forceCloudfrontUrl(
          server,
          agent.owner.userImage,
        )
      }
    })

    return reply.status(200).send({ sharedAgents })
  } catch (error) {
    console.error('Error getting shared agents:', error)
    return reply.status(500).send({
      error: 'Failed to get shared agents',
    })
  }
}
