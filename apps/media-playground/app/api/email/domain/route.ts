import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const apiUrl = process.env.NEXT_PUBLIC_EDEN_API_URL

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const agentId = searchParams.get('agentId')
  const refresh = searchParams.get('refresh')

  if (!agentId) {
    return new NextResponse(JSON.stringify({ message: 'Missing agentId' }), {
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
    const response = await axios.get(
      `${apiUrl}/v2/agents/${agentId}/email/domain`,
      {
        params: {
          refresh: refresh === 'true',
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return new NextResponse(
        JSON.stringify({ message: 'Domain not configured' }),
        { status: 404 },
      )
    }
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { agentId, domain } = body as { agentId?: string; domain?: string }

  if (!agentId || !domain) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing agentId or domain' }),
      {
        status: 400,
      },
    )
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const response = await axios.post(
      `${apiUrl}/v2/agents/${agentId}/email/domain`,
      { domain },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    return NextResponse.json(response.data, { status: 201 })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return new NextResponse(JSON.stringify({ message: 'Missing agentId' }), {
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
    const response = await axios.delete(
      `${apiUrl}/v2/agents/${agentId}/email/domain`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return new NextResponse(
        JSON.stringify({ message: 'Domain not configured' }),
        { status: 404 },
      )
    }
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
