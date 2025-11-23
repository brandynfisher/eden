import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authToken = await getAuthToken(request)
    const populateOwner = request.nextUrl.searchParams.get('populateOwner')

    if (!authToken) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 },
      )
    }

    const client = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const response = await client.userPreferences.get({
      populateOwner: populateOwner === 'true',
    })

    if (response.error) {
      return NextResponse.json({ message: response.error }, { status: 400 })
    }

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}

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
    const { agentId } = body

    if (!agentId) {
      return NextResponse.json(
        { message: 'agentId is required' },
        { status: 400 },
      )
    }

    // Make direct API call to add agent to last_agents
    const apiUrl = process.env.NEXT_PUBLIC_EDEN_API_URL
    const response = await fetch(
      `${apiUrl}/v2/user-preferences/add-last-agent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ agent_id: agentId }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { message: errorData.message || 'Failed to update preferences' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
