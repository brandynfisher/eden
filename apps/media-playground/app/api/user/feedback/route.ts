import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  let payload: { message?: string; subject?: string; category?: string }
  try {
    payload = await request.json()
  } catch {
    return new NextResponse(JSON.stringify({ message: 'Invalid payload' }), {
      status: 400,
    })
  }

  const { message, subject, category } = payload || {}

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return new NextResponse(
      JSON.stringify({ message: 'Message is required' }),
      {
        status: 400,
      },
    )
  }

  const eden = new EdenClient({
    edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
    token: authToken,
  })

  try {
    const response = await eden.userFeedback.submit({
      message,
      subject,
      category,
    })
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error('[USER_FEEDBACK]', errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
