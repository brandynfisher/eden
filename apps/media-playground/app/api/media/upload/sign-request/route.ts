import { handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { NextApiRequest } from 'next'
import { getAuthToken } from '@/lib/auth'

export async function GET(request: NextApiRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      { status: 401 },
    )
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_EDEN_API_URL}/media/upload/sign-request`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    return Response.json(response.data)
  } catch (error) {
    console.log(error)
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: 500 },
    )
  }
}
