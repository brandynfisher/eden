import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import {
  ArtifactsV2DeleteResponse,
  ArtifactsV2GetResponse,
  ArtifactsV2UpdateArguments,
  ArtifactsV2UpdateResponse,
  EdenClient,
} from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  if (!id) {
    return new NextResponse(JSON.stringify({ message: 'Missing id' }), {
      status: 400,
    })
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken || undefined,
    })

    const res = await eden.artifacts.get({
      artifactId: id,
    })

    if (!res) {
      return new NextResponse(
        JSON.stringify({ message: 'Artifact not found' }),
        {
          status: 404,
        },
      )
    }

    return NextResponse.json<ArtifactsV2GetResponse>(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

export async function PATCH(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  if (!id) {
    return new NextResponse(JSON.stringify({ message: 'Missing id' }), {
      status: 400,
    })
  }

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
    deleted,
  } = requestJson as ArtifactsV2UpdateArguments

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const res = await eden.artifacts.update({
      artifactId: id,
      title,
      type,
      parent,
      agents,
      public: isPublic,
      description,
      session,
      creations,
      deleted,
    })

    if (!res) {
      return new NextResponse(
        JSON.stringify({ message: 'Artifact update error' }),
        {
          status: 500,
        },
      )
    }

    return NextResponse.json<ArtifactsV2UpdateResponse>(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  if (!id) {
    return new NextResponse(JSON.stringify({ message: 'Missing id' }), {
      status: 400,
    })
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    await eden.artifacts.delete({
      artifactId: id,
    })

    return NextResponse.json<ArtifactsV2DeleteResponse>({
      message: 'Artifact deleted successfully',
    })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
