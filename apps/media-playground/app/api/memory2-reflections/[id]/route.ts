import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/memory2-reflections/[id] - Update reflection content
export async function PATCH(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  if (!id) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing reflection id' }),
      { status: 400 },
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
    const { content } = await request.json()

    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const response = await eden.apiCall(() => ({
      url: `/v2/memory2-reflections/${id}`,
      method: 'PATCH',
      data: { content },
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating reflection:', error)
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

// DELETE /api/memory2-reflections/[id] - Delete reflection
export async function DELETE(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  if (!id) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing reflection id' }),
      { status: 400 },
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

    const response = await eden.apiCall(() => ({
      url: `/v2/memory2-reflections/${id}`,
      method: 'DELETE',
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting reflection:', error)
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
