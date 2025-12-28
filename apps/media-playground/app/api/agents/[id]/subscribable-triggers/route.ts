import { handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id) {
    return new NextResponse(JSON.stringify({ message: 'Missing agent id' }), {
      status: 400,
    })
  }

  try {
    const edenApiUrl =
      process.env.NEXT_PUBLIC_EDEN_API_URL || 'https://api.eden.art'

    const response = await axios.get(
      `${edenApiUrl}/v2/agents/${id}/subscribable-triggers`,
    )

    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
