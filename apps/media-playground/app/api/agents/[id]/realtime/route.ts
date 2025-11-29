import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const apiUrl = process.env.NEXT_PUBLIC_EDEN_API_URL

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!params.id) {
    return NextResponse.json({ message: 'Missing agent id' }, { status: 400 })
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await axios.get(
      `${apiUrl}/v2/agents/${params.id}/realtime`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    )
    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || errorMessage },
        { status: error.response?.status || 500 },
      )
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!params.id) {
    return NextResponse.json({ message: 'Missing agent id' }, { status: 400 })
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const response = await axios.patch(
      `${apiUrl}/v2/agents/${params.id}/realtime`,
      body,
      { headers: { Authorization: `Bearer ${authToken}` } },
    )
    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || errorMessage },
        { status: error.response?.status || 500 },
      )
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
