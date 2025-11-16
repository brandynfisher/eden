import { User } from '../../src/models/User'
import { UserIdentity } from '../../src/models/UserIdentity'
import { UserIdentityHistory } from '../../src/models/UserIdentityHistory'
import {
  linkUserIdentity,
  unlinkUserIdentity,
} from '../../src/services/userIdentityService'
import { describe, expect, it } from 'vitest'

const loadUserById = async (userId: string) => {
  const user = await User.findOne({ userId })
  if (!user) {
    throw new Error(`User ${userId} not found`)
  }
  return user
}

describe('user identity service', () => {
  const provider = 'discord'
  const providerUserId = 'discord-user-123'

  const loadIdentity = async () => {
    const identity = await UserIdentity.findOne({
      provider,
      provider_user_id: providerUserId,
    })
    if (!identity) {
      throw new Error('User identity not found')
    }
    return identity
  }

  it('links an identity to a user and records history', async () => {
    const user = await loadUserById('user')
    const identity = await linkUserIdentity({
      provider,
      provider_user_id: providerUserId,
      target_user_id: user._id,
      actor_eden_user_id: user._id,
      metadata: { username: 'discord_user' },
    })

    expect(identity.provider).toBe(provider)
    expect(identity.provider_user_id).toBe(providerUserId)
    expect(identity.eden_user_id?.toString()).toBe(user._id.toString())
    expect(identity.status).toBe('linked')
    expect(identity.linked_at).toBeInstanceOf(Date)

    const histories = await UserIdentityHistory.find({
      user_identity_id: identity._id,
    })
    expect(histories).toHaveLength(1)
    expect(histories[0].event_type).toBe('link')
    expect(histories[0].eden_user_id?.toString()).toBe(user._id.toString())
  })

  it('does not duplicate link history when re-linking to the same user', async () => {
    const user = await loadUserById('user')
    await linkUserIdentity({
      provider,
      provider_user_id: providerUserId,
      target_user_id: user._id,
      actor_eden_user_id: user._id,
    })

    await linkUserIdentity({
      provider,
      provider_user_id: providerUserId,
      target_user_id: user._id,
      actor_eden_user_id: user._id,
    })

    const identity = await loadIdentity()
    const histories = await UserIdentityHistory.find({
      user_identity_id: identity._id,
    })

    expect(histories).toHaveLength(1)
    expect(histories[0].event_type).toBe('link')
  })

  it('records a transfer event when linking to a different user', async () => {
    const originalUser = await loadUserById('user')
    const secondUser = await loadUserById('basicuser')

    await linkUserIdentity({
      provider,
      provider_user_id: providerUserId,
      target_user_id: originalUser._id,
      actor_eden_user_id: originalUser._id,
    })

    const updatedIdentity = await linkUserIdentity({
      provider,
      provider_user_id: providerUserId,
      target_user_id: secondUser._id,
      actor_eden_user_id: secondUser._id,
      metadata: { reason: 'user_switch' },
    })

    expect(updatedIdentity.eden_user_id?.toString()).toBe(
      secondUser._id.toString(),
    )

    const histories = await UserIdentityHistory.find({
      user_identity_id: updatedIdentity._id,
    }).sort({ created_at: 1 })

    expect(histories).toHaveLength(2)
    expect(histories[0].event_type).toBe('link')
    expect(histories[1].event_type).toBe('transfer')
    const transferMetadata = histories[1].metadata as
      | Record<string, unknown>
      | undefined
    expect(transferMetadata?.previous_eden_user_id).toBeDefined()
  })

  it('unlinks an identity and records history', async () => {
    const user = await loadUserById('user')
    await linkUserIdentity({
      provider,
      provider_user_id: providerUserId,
      target_user_id: user._id,
      actor_eden_user_id: user._id,
    })

    const identity = await unlinkUserIdentity({
      provider,
      provider_user_id: providerUserId,
      actor_eden_user_id: user._id,
      metadata: { initiated_by: 'user' },
    })

    expect(identity.status).toBe('unlinked')
    expect(identity.eden_user_id).toBeNull()
    expect(identity.unlinked_at).toBeInstanceOf(Date)

    const histories = await UserIdentityHistory.find({
      user_identity_id: identity._id,
    }).sort({ created_at: 1 })

    expect(histories).toHaveLength(2)
    expect(histories[1].event_type).toBe('unlink')
  })
})
