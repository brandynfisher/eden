import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  const { searchParams } = new URL(request.url)
  const signerUuid = searchParams.get('signerUuid')

  if (!signerUuid) {
    return new NextResponse(JSON.stringify({ message: 'Missing signerUuid' }), {
      status: 400,
    })
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/auth/farcaster/managed-signer/status?signerUuid=${signerUuid}`,
      {
        withCredentials: true,
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : undefined,
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
