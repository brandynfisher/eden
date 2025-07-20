import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { CreatorsUpdateArguments, EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authToken = await getAuthToken(request)

    if (!authToken) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { preferences, username, userImage, instagramHandle } = body

    const client = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const updateData: CreatorsUpdateArguments = {}

    if (preferences) {
      updateData.preferences = preferences
    }
    if (username) {
      updateData.username = username
    }
    if (userImage) {
      updateData.userImage = userImage
    }
    if (instagramHandle !== undefined) {
      updateData.instagramHandle = instagramHandle
    }

    const response = await client.creators.updateV2(updateData)

    if (response.error) {
      return NextResponse.json({ message: response.error }, { status: 400 })
    }

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
