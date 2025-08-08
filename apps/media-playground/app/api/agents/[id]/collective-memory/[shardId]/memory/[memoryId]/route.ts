import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params: { id, shardId, memoryId } }: { params: { id: string; shardId: string; memoryId: string } },
) {
  if (!id || !shardId || !memoryId) {
    return new NextResponse(JSON.stringify({ message: 'Missing required parameters' }), {
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
    const { arrayField } = await request.json()

    if (!arrayField || !['facts', 'unabsorbed_memory_ids'].includes(arrayField)) {
      return new NextResponse(JSON.stringify({ message: 'Invalid arrayField' }), {
        status: 400,
      })
    }

    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const response = await eden.apiCall(
      () => ({
        url: `/v2/agents/${id}/memory-agent/${shardId}/memory/${memoryId}`,
        method: 'DELETE',
        data: { arrayField },
      })
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error removing memory from collective memory:', error)
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}