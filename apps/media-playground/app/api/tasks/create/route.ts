import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new Response(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    // @todo: splice in a post request towards modal instead of the classic eden sdk create call
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })
    const res = await eden.tasks.create({
      generatorName: 'create',
      config: { text_prompt: 'test123' },
    })
    return Response.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
