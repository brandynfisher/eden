import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const apiUrl = process.env.NEXT_PUBLIC_EDEN_API_URL

export async function POST(request: NextRequest) {
  const { getToken } = await auth()
  const authToken = await getToken()

  if (!authToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { agentId } = body

    const response = await fetch(`${apiUrl}/v2/user-preferences/unpin-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ agent_id: agentId }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error unpinning agent:', error)
    return NextResponse.json(
      { error: 'Failed to unpin agent' },
      { status: 500 },
    )
  }
}
