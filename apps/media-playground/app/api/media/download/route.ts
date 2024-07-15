import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { CONFIG } from 'garden/src/lib/config'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new Response(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const queryParams = request.nextUrl.searchParams
    const url = queryParams.get('url')
    const fileName = queryParams.get('fileName')
    const fileExtension = queryParams.get('fileExtension')

    if (!url || !fileName || !fileExtension) {
      return new Response(JSON.stringify({ message: 'Invalid request' }), {
        status: 401,
      })
    }

    const response = await axios.get(
      `${CONFIG.API_URL}/media/download?url=${url}&fileName=${fileName}&fileExtension=${fileExtension}`,
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
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
