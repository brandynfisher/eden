import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params: { id, shardId } }: { params: { id: string; shardId: string } },
) {
  if (!id || !shardId) {
    return new NextResponse(JSON.stringify({ message: 'Missing agent id or shard id' }), {
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
    const updates = await request.json()

    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const response = await eden.apiCall(
      () => ({
        url: `/v2/agents/${id}/memory-agent/${shardId}`,
        method: 'PATCH',
        data: updates,
      })
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating collective memory:', error)
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}