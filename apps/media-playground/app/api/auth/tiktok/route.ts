import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return new NextResponse(JSON.stringify({ message: 'Missing agentId' }), {
      status: 400,
    })
  }

  try {
    const basePath = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/auth/tiktok/disconnect?agentId=${agentId}`
    const response = await axios.delete(basePath, {
      withCredentials: true,
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : undefined,
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
