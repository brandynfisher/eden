import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { session_id: string } },
) {
  if (!params.session_id) {
    return new NextResponse(JSON.stringify({ message: 'Missing session_id' }), {
      status: 400,
    })
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  try {
    const body = await request.json()
    const { message_id, title } = body

    if (!message_id) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing message_id' }),
        {
          status: 400,
        },
      )
    }

    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken !== null ? authToken : undefined,
    })

    const res = await eden.sessions.v2.share.create({
      session_id: params.session_id,
      message_id,
      title,
    })

    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
