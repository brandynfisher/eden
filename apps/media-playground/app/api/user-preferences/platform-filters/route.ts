import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const authToken = await getAuthToken(request)

    if (!authToken) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { platforms } = body

    if (!platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { message: 'platforms array is required' },
        { status: 400 },
      )
    }

    const apiUrl = process.env.NEXT_PUBLIC_EDEN_API_URL
    const response = await fetch(
      `${apiUrl}/v2/user-preferences/platform-filters`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ platforms }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { message: errorData.message || 'Failed to update platform filters' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
