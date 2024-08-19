import { env } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { auth } from '@clerk/nextjs/server'
import axios from 'axios'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { getToken } = auth()
  const authToken = await getToken()

  try {
    const searchParams = request.nextUrl.searchParams
    const route = `${
      env.NEXT_PUBLIC_EDEN_API_URL
    }/v2/feed-cursor/models?${searchParams.toString()}`

    const response = await axios.get(route, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
