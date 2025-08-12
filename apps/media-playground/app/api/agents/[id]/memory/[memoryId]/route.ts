import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params: { id, memoryId } }: { params: { id: string, memoryId: string } },
) {
  if (!id || !memoryId) {
    return new NextResponse(JSON.stringify({ message: 'Missing agent id or memory id' }), {
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

    const response = await eden.apiCall(
      () => ({
        url: `/v2/agents/${id}/memory/${memoryId}`,
        method: 'DELETE',
      })
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error removing unabsorbed directive:', error)
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}