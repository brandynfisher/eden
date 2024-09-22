import { clerkClient, getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const updateUsername = async (body: { username: string; userId: string }) => {
  const { username, userId } = body

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const updatedUser = await clerkClient.users.updateUser(userId, { username })

  return NextResponse.json({ updatedUser })
}

const updateProfileImage = async (body: { file: string; userId: string }) => {
  const { file, userId } = body

  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 })
  }

  const base64Data = file.split(',')[1]
  const buffer = Buffer.from(base64Data, 'base64')
  const f = new File([buffer], 'profile_image', { type: 'image/png' })

  const updatedUser = await clerkClient.users.updateUserProfileImage(userId, {
    file: f,
  })

  return NextResponse.json({ updatedUser })
}

const updateEmail = async (body: { email: string; userId: string }) => {
  const { email, userId } = body

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = await clerkClient.users.getUser(userId)

  const existingEmailAddress = user.emailAddresses.find(
    emailAddress => emailAddress.emailAddress === email,
  )

  try {
    if (existingEmailAddress) {
      await clerkClient.emailAddresses.updateEmailAddress(
        existingEmailAddress.id,
        {
          primary: true,
          verified: true,
        },
      )
    } else {
      await clerkClient.emailAddresses.createEmailAddress({
        userId,
        emailAddress: email,
        primary: true,
        verified: true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const clerkError = error as {
      errors: { message: string }[]
      clerkError: boolean
    }

    const errorMessage = clerkError.clerkError
      ? clerkError.errors[0].message
      : 'Failed to update email'

    return NextResponse.json(errorMessage, { status: 400 })
  }
}

const removeEmail = async (body: { emailId: string; userId: string }) => {
  const { emailId } = body

  if (!emailId) {
    return NextResponse.json({ error: 'Email ID is required' }, { status: 400 })
  }

  await clerkClient.emailAddresses.deleteEmailAddress(emailId)

  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)
  const { requestType, ...body } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  switch (requestType) {
    case 'updateUsername': {
      return updateUsername({
        username: body.username,
        userId: userId,
      })
    }
    case 'updateProfileImage': {
      return updateProfileImage({
        file: body.file,
        userId: userId,
      })
    }
    case 'updateEmail': {
      return updateEmail({
        email: body.email,
        userId: userId,
      })
    }
    case 'removeEmail': {
      return removeEmail({
        emailId: body.emailId,
        userId: userId,
      })
    }
    default: {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 },
      )
    }
  }
}
