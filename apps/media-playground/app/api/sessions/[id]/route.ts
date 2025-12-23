import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import {
  EdenClient,
  SessionSettings,
  SessionStatus,
  SessionType,
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

  // Get parent_session_id from query params if present
  const { searchParams } = new URL(request.url)
  const parentSessionId = searchParams.get('parent_session_id')

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken !== null ? authToken : undefined,
    })

    const res = await eden.sessions.v2.get({
      session_id: id,
      ...(parentSessionId && { parent_session_id: parentSessionId }),
    })

    if (!res) {
      return new NextResponse(
        JSON.stringify({ message: 'Session not found' }),
        {
          status: 404,
        },
      )
    }

    return NextResponse.json(res)
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

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken !== null ? authToken : undefined,
    })

    const res = await eden.sessions.v2.delete({ session_id: id })

    if (!res.success) {
      return new NextResponse(JSON.stringify({ message: res.error }), {
        status: 500,
      })
    }

    return NextResponse.json(res)
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
  { params: { id } }: { params: { id: string } },
) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  const body = await request.json()
  const {
    title,
    pinned,
    extras,
    agent_ids,
    session_type,
    settings,
    context,
    budget,
    status,
  } = body

  if (
    title === undefined &&
    pinned === undefined &&
    extras === undefined &&
    agent_ids === undefined &&
    session_type === undefined &&
    settings === undefined &&
    context === undefined &&
    budget === undefined &&
    status === undefined
  ) {
    return new NextResponse(
      JSON.stringify({
        message: 'No fields to update',
      }),
      {
        status: 400,
      },
    )
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken !== null ? authToken : undefined,
    })

    const updateData: {
      session_id: string
      title?: string
      pinned?: boolean
      extras?: { exclude_memory?: boolean; is_public?: boolean }
      agent_ids?: string[]
      session_type?: SessionType
      settings?: SessionSettings
      context?: string
      budget?: {
        manna_budget?: number
        token_budget?: number
        turn_budget?: number
      }
      status?: SessionStatus
    } = { session_id: id }

    if (title !== undefined) {
      updateData.title = title
    }
    if (pinned !== undefined) {
      updateData.pinned = pinned
    }
    if (extras !== undefined) {
      updateData.extras = extras
    }
    if (agent_ids !== undefined) {
      updateData.agent_ids = agent_ids
    }
    if (session_type !== undefined) {
      updateData.session_type = session_type as SessionType
    }
    if (settings !== undefined) {
      updateData.settings = settings
    }
    if (context !== undefined) {
      updateData.context = context
    }
    if (budget !== undefined) {
      updateData.budget = budget
    }
    if (status !== undefined) {
      updateData.status = status as SessionStatus
    }

    const res = await eden.sessions.v2.update(updateData)

    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
