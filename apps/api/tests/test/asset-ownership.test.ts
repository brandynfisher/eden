import { Creation } from '../../src/models/Creation'
import { Generator } from '../../src/models/Generator'
import { Task } from '../../src/models/Task'
import { User } from '../../src/models/User'
import { Message } from '../../src/models/v2/Message'
import { Session } from '../../src/models/v2/SessionV2'
import {
  resolveCreationOwnerId,
  resolveMessageOwnerId,
  resolveTaskOwnerId,
} from '../../src/services/assetOwnershipService'
import { MediaType } from '@edenlabs/eden-sdk'
import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'

const getDefaultUser = async () => {
  const user = await User.findOne({ userId: 'user' })
  if (!user) {
    throw new Error('default user missing')
  }
  return user
}

const getDefaultGenerator = async () => {
  const generator = await Generator.findOne({ generatorName: 'test' })
  if (!generator) {
    throw new Error('generator missing')
  }
  return generator
}

describe('asset ownership', () => {
  it('defaults task eden_user_id to the user id when missing', async () => {
    const user = await getDefaultUser()
    const generator = await getDefaultGenerator()
    const taskId = `task-${new ObjectId().toString()}`
    const task = await Task.create({
      user: user._id,
      generator: generator._id,
      versionId: '1.0.0',
      cost: 1,
      taskId,
      config: {},
    })

    expect(task.eden_user_id?.toString()).toBe(user._id.toString())
  })

  it('defaults creation eden_user_id to the user id when missing', async () => {
    const user = await getDefaultUser()
    const generator = await getDefaultGenerator()
    const taskId = `task-${new ObjectId().toString()}`
    const task = await Task.create({
      user: user._id,
      generator: generator._id,
      versionId: '1.0.0',
      cost: 1,
      taskId,
      config: {},
    })

    const creation = await Creation.create({
      user: user._id,
      task: task._id,
      uri: 'ipfs://test',
      name: 'test creation',
      mediaAttributes: {
        type: MediaType.Image,
      },
      attributes: {},
    })

    expect(creation.eden_user_id?.toString()).toBe(user._id.toString())
  })

  it('defaults message eden_user_id to the sender id when missing', async () => {
    const user = await getDefaultUser()
    const session = await Session.create({
      owner: user._id,
      agents: [],
    })

    const message = await Message.create({
      session: [session._id],
      sender: user._id,
      role: 'user',
      content: 'hello world',
    })

    expect(message.eden_user_id?.toString()).toBe(user._id.toString())
  })

  it('resolves owners with eden_user_id first and falls back to legacy fields', () => {
    const edenUserId = new ObjectId()
    const fallbackUserId = new ObjectId()

    expect(
      resolveTaskOwnerId({
        eden_user_id: edenUserId,
        user: fallbackUserId,
      })?.toString(),
    ).toBe(edenUserId.toString())

    expect(
      resolveCreationOwnerId({
        user: fallbackUserId,
      })?.toString(),
    ).toBe(fallbackUserId.toString())

    expect(
      resolveMessageOwnerId({
        sender: fallbackUserId,
      })?.toString(),
    ).toBe(fallbackUserId.toString())
  })
})
