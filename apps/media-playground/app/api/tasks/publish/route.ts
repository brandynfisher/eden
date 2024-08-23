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

  const requestJson = await request.json()

  if (!requestJson) {
    return new NextResponse(JSON.stringify({ message: 'No data passed' }), {
      status: 400,
    })
  }

  if (!requestJson.taskId) {
    return new NextResponse(JSON.stringify({ message: 'Missing taskId' }), {
      status: 400,
    })
  }

  if (!requestJson.resultFilename) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing resultFilename' }),
      {
        status: 400,
      },
    )
  }

  const { taskId, resultFilename } = requestJson

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })
    const res = await eden.tasks.publishV2({ taskId, resultFilename })
    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return NextResponse.json(
      { message: errorMessage },
      {
        status: 500,
      },
    )
  }
}
