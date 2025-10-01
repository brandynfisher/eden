import { getAuthToken } from '@/lib/auth'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authToken = getAuthToken(req)
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await axios.get(
      `${process.env.EDEN_API_URL}/v2/sessions/shared`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        {
          error: error.response.data.error || 'Failed to fetch shared sessions',
        },
        { status: error.response.status },
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
