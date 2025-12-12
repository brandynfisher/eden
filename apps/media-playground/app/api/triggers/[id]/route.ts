import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params

  if (!id) {
    return new NextResponse(JSON.stringify({ message: 'Missing trigger id' }), {
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

  const requestJson = await request.json()

  try {
    const edenApiUrl =
      process.env.NEXT_PUBLIC_EDEN_API_URL || 'https://api.eden.art'

    const response = await axios.patch(
      `${edenApiUrl}/v2/triggers/${id}`,
      requestJson,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params

  if (!id) {
    return new NextResponse(JSON.stringify({ message: 'Missing trigger id' }), {
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
    const edenApiUrl =
      process.env.NEXT_PUBLIC_EDEN_API_URL || 'https://api.eden.art'

    const response = await axios.delete(`${edenApiUrl}/v2/triggers/${id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
