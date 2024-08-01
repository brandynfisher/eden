import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const queryParams = request.nextUrl.searchParams
    const url = queryParams.get('url')
    const fileName = queryParams.get('fileName')
    const fileExtension = queryParams.get('fileExtension')

    if (!url || !fileName || !fileExtension) {
      return new NextResponse(JSON.stringify({ message: 'Invalid request' }), {
        status: 400,
      })
    }

    const response = await axios.get(
      `${CONFIG.NEXT_PUBLIC_EDEN_API_URL}/media/download?url=${url}&fileName=${fileName}&fileExtension=${fileExtension}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    const { signedUrl } = response.data
    return Response.json({ signedUrl })
  } catch (error) {
    console.log(error)
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
