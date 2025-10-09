import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  if (!id) {
    return new NextResponse(JSON.stringify({ message: 'Missing session id' }), {
      status: 400,
    })
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  console.log(`[MARK SESSION READ] PATCH request for session: ${id}`)

  try {
    const response = await axios.patch(
      `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/sessions/${id}/mark-read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    console.log(`[MARK SESSION READ] Success:`, response.data)

    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error('[MARK SESSION READ] Error:', errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
