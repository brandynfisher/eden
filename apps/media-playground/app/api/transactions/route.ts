import { getAuthToken } from '@/lib/auth'
import { env } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const route = `${
      env.NEXT_PUBLIC_EDEN_API_URL
    }/v2/user/transactions?${searchParams.toString()}`

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
