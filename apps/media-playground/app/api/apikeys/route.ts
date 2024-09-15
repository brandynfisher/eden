import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken !== null ? authToken : undefined,
    })

    const res = await eden.apiKeys.list()

    if (!res) {
      return new NextResponse(
        JSON.stringify({ message: 'Api keys not found' }),
        {
          status: 404,
        },
      )
    }

    return NextResponse.json({ apiKeys: res.docs })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

export async function DELETE(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  const { apiKey } = await request.json()

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken !== null ? authToken : undefined,
    })

    const res = await eden.apiKeys.delete({ apiKey })

    if (!res) {
      return new NextResponse(
        JSON.stringify({ message: 'Api key not found' }),
        {
          status: 404,
        },
      )
    }

    return NextResponse.json({ message: 'Api key deleted' })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  const { note } = await request.json()

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken !== null ? authToken : undefined,
    })
    const response = await eden.apiKeys.create({ note })
    return NextResponse.json({ apiKey: response.apiKey })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
