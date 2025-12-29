import { getAuthToken } from '@/lib/auth'
import { env } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    // Parse request body
    const body = await request.json()
    const {
      session_id,
      tool_call_id,
      tool_name,
      args,
      status,
      result,
      error,
      task_id,
    } = body

    if (!session_id) {
      return new NextResponse(
        JSON.stringify({ message: 'session_id is required' }),
        { status: 400 },
      )
    }

    if (!tool_name) {
      return new NextResponse(
        JSON.stringify({ message: 'tool_name is required' }),
        { status: 400 },
      )
    }

    // Get user ID
    const eden = new EdenClient({
      edenApiUrl: env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const userResponse = await eden.creators.meV2()
    if (!userResponse?.creator) {
      return new NextResponse(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      })
    }

    const userId = userResponse.creator._id

    const requestPayload = {
      session_id,
      user_id: userId,
      tool_call_id,
      tool_name,
      args,
      status,
      result,
      error,
      task_id,
    }

    // Call Fastify endpoint to add/update tool call
    const apiResponse = await fetch(
      `${env.NEXT_PUBLIC_EDEN_API_URL}/v2/sessions/add-tool-call`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestPayload),
      },
    )

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      throw new Error(`Failed to add tool call: ${errorText}`)
    }

    const data = await apiResponse.json()
    return NextResponse.json({
      success: true,
      tool_call_id: data.tool_call_id,
      message_id: data.message_id,
    })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
