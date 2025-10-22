import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  try {
    const basePath = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/user/request-deletion`
    const response = await axios.post(
      basePath,
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : undefined,
        },
      },
    )
    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)

    // Check if it's a 429 (rate limit) error
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      return new NextResponse(
        JSON.stringify({
          message:
            error.response.data.message ||
            'Too many requests. Please try again later.',
        }),
        {
          status: 429,
        },
      )
    }

    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
