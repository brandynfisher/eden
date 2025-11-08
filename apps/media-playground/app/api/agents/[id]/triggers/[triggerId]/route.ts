import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { AgentsDeleteTriggerResponse, EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { id, triggerId } }: { params: { id: string; triggerId: string } },
) {
  if (!id || !triggerId) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing id or triggerId' }),
      {
        status: 400,
      },
    )
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

    const result = await eden.agents.triggers.get({
      agentId: id,
      triggerId,
    })

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

export async function PATCH(
  request: NextRequest,
  { params: { id, triggerId } }: { params: { id: string; triggerId: string } },
) {
  if (!id || !triggerId) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing id or triggerId' }),
      {
        status: 400,
      },
    )
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const body = await request.json()

    // do not overwrite the original user who owns that Trigger, so we remove user from the request body
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { user: _user, ...updateData } = body

    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const result = await eden.agents.triggers.update({
      agentId: id,
      triggerId,
      ...updateData,
    })

    return NextResponse.json(result)
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
  { params: { id, triggerId } }: { params: { id: string; triggerId: string } },
) {
  if (!id || !triggerId) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing id or triggerId' }),
      {
        status: 400,
      },
    )
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

    const result = await eden.agents.triggers.delete({
      agentId: id,
      triggerId,
    })

    return NextResponse.json<AgentsDeleteTriggerResponse>(result)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
