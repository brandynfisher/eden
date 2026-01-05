import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } },
) {
  const { guildId } = params

  if (!guildId) {
    return new NextResponse(JSON.stringify({ message: 'Missing guildId' }), {
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
    const basePath = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/deployments/discord/guilds/${guildId}/roles`
    const response = await axios.get(basePath, {
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
