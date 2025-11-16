import { User } from '../models/User'
import { UserIdentity } from '../models/UserIdentity'
import { UserIdentityHistory } from '../models/UserIdentityHistory'
import { Types } from 'mongoose'

type IdentityMetadata = Record<string, unknown>

export type LinkUserIdentityParams = {
  provider: string
  provider_user_id: string
  target_user_id: Types.ObjectId
  actor_eden_user_id?: Types.ObjectId
  metadata?: IdentityMetadata
}

export type UnlinkUserIdentityParams = {
  provider: string
  provider_user_id: string
  actor_eden_user_id?: Types.ObjectId
  metadata?: IdentityMetadata
}

const ensureUserHasCanonicalId = async (userId: Types.ObjectId) => {
  const user = await User.findById(userId)
  if (!user) {
    throw new Error(`User ${userId.toString()} not found`)
  }
  if (!user.eden_user_id) {
    user.eden_user_id = user._id
    await user.save()
  }
  return user
}

const mergeMetadata = (
  base?: IdentityMetadata,
  extra?: IdentityMetadata,
): IdentityMetadata | undefined => {
  if (!base && !extra) {
    return undefined
  }
  return {
    ...(base ?? {}),
    ...(extra ?? {}),
  }
}

export const linkUserIdentity = async ({
  provider,
  provider_user_id,
  target_user_id,
  actor_eden_user_id,
  metadata,
}: LinkUserIdentityParams) => {
  await ensureUserHasCanonicalId(target_user_id)
  const now = new Date()
  let identity = await UserIdentity.findOne({
    provider,
    provider_user_id,
  })

  if (!identity) {
    identity = await UserIdentity.create({
      provider,
      provider_user_id,
      eden_user_id: target_user_id,
      status: 'linked',
      linked_at: now,
      unlinked_at: null,
      metadata,
    })
    await UserIdentityHistory.create({
      user_identity_id: identity._id,
      eden_user_id: target_user_id,
      actor_eden_user_id: actor_eden_user_id ?? target_user_id,
      event_type: 'link',
      metadata,
    })
    return identity
  }

  if (
    identity.eden_user_id?.toString() === target_user_id.toString() &&
    identity.status === 'linked'
  ) {
    return identity
  }

  const previousEdenUserId = identity.eden_user_id
  identity.eden_user_id = target_user_id
  identity.status = 'linked'
  identity.linked_at = now
  identity.unlinked_at = null
  identity.metadata = mergeMetadata(
    identity.metadata as IdentityMetadata | undefined,
    metadata,
  )
  await identity.save()

  await UserIdentityHistory.create({
    user_identity_id: identity._id,
    eden_user_id: target_user_id,
    actor_eden_user_id: actor_eden_user_id ?? target_user_id,
    event_type: previousEdenUserId ? 'transfer' : 'link',
    metadata: mergeMetadata(metadata, {
      previous_eden_user_id: previousEdenUserId,
    }),
  })

  return identity
}

export const unlinkUserIdentity = async ({
  provider,
  provider_user_id,
  actor_eden_user_id,
  metadata,
}: UnlinkUserIdentityParams) => {
  const identity = await UserIdentity.findOne({
    provider,
    provider_user_id,
  })

  if (!identity) {
    throw new Error(
      `Identity ${provider}:${provider_user_id} does not exist and cannot be unlinked`,
    )
  }

  if (identity.status === 'unlinked' && !identity.eden_user_id) {
    return identity
  }

  const now = new Date()
  const previousEdenUserId = identity.eden_user_id
  identity.status = 'unlinked'
  identity.eden_user_id = null
  identity.unlinked_at = now
  await identity.save()

  await UserIdentityHistory.create({
    user_identity_id: identity._id,
    eden_user_id: previousEdenUserId ?? undefined,
    actor_eden_user_id: actor_eden_user_id ?? previousEdenUserId ?? undefined,
    event_type: 'unlink',
    metadata: mergeMetadata(metadata, {
      previous_eden_user_id: previousEdenUserId,
    }),
  })

  return identity
}
