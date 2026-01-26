import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  const payload = await request.json().catch(() => null)
  const hasChannelIds = Array.isArray(payload?.channelIds)
  const hasChannels = Array.isArray(payload?.channels)
  if (!payload?.token || (!hasChannelIds && !hasChannels)) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing token or channelIds' }),
      { status: 400 },
    )
  }

  try {
    const basePath = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/deployments/discord/validate-bot-channels`
    const response = await axios.post(basePath, payload, {
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
