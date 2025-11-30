import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import {
  ArtifactsV2CreateArguments,
  ArtifactsV2CreateResponse,
  ArtifactsV2ListResponse,
  EdenClient,
} from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const userId = searchParams.get('userId') || undefined
  const type = searchParams.get('type') || undefined
  const agentId = searchParams.get('agentId') || undefined
  const sessionId = searchParams.get('sessionId') || undefined

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken || undefined,
    })

    const res = await eden.artifacts.list({
      page,
      limit,
      userId,
      type,
      agentId,
      sessionId,
    })

    return NextResponse.json<ArtifactsV2ListResponse>(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  const requestJson = await request.json()
  const {
    title,
    type,
    parent,
    agents,
    public: isPublic,
    description,
    session,
    creations,
  } = requestJson as ArtifactsV2CreateArguments

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const res = await eden.artifacts.create({
      title,
      type,
      parent,
      agents,
      public: isPublic,
      description,
      session,
      creations,
    })

    if (!res) {
      return new NextResponse(
        JSON.stringify({ message: 'Artifact create error' }),
        {
          status: 500,
        },
      )
    }

    return NextResponse.json<ArtifactsV2CreateResponse>(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
