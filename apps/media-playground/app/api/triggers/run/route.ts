import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🚀 Trigger execution request received')

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    console.log('❌ No auth token')
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  let requestJson
  try {
    requestJson = await request.json()
  } catch (e) {
    console.log('❌ Failed to parse request body:', e)
    return new NextResponse(JSON.stringify({ message: 'Invalid JSON' }), {
      status: 400,
    })
  }

  const { trigger_id } = requestJson

  if (!trigger_id) {
    console.log('❌ Missing trigger_id')
    return new NextResponse(JSON.stringify({ message: 'Missing trigger_id' }), {
      status: 400,
    })
  }

  console.log('🎯 Executing trigger:', trigger_id)

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/triggers/run`

    const response = await axios.post(
      apiUrl,
      { trigger_id },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    console.log('✅ Trigger executed successfully')
    return NextResponse.json(response.data)
  } catch (error) {
    console.log(
      '❌ Trigger execution failed:',
      error instanceof Error ? error.message : String(error),
    )

    if (axios.isAxiosError(error)) {
      console.log('- Status:', error.response?.status)
      console.log('- Response:', error.response?.data)
    }

    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
