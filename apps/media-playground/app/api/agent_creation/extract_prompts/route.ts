import { env } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    })
  }

  try {
    const body = await request.json()
    console.log('[Extract Agent Prompts] Request body:', body)
    console.log(
      '[Extract Agent Prompts] Target URL:',
      `${env.NEXT_PUBLIC_EDEN_API_URL}/agent_creation/extract_prompts`,
    )

    const response = await fetch(
      `${env.NEXT_PUBLIC_EDEN_API_URL}/agent_creation/extract_prompts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      },
    )

    console.log('[Extract Agent Prompts] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        '[Extract Agent Prompts] Backend error response:',
        response.status,
        errorText,
      )
      return new NextResponse(
        JSON.stringify({
          message: `Agent prompts extraction failed: ${response.statusText}`,
          details: errorText,
        }),
        {
          status: response.status,
        },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error('[Extract Agent Prompts] Exception:', errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
