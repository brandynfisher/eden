import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } },
) {
  if (!params || !params.name) {
    return new Response(JSON.stringify({ message: 'Missing name' }), {
      status: 400,
    })
  }

  const authToken = await getAuthToken(request)

  console.log('authToken undefined', request.url, params)

  if (!authToken) {
    return new Response(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const res = await eden.creators.get({ userId: params.name })

    if (!res) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      })
    }

    return Response.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
