import { EdenClient } from '@edenlabs/eden-sdk'
import { handleAxiosServerError } from '@/lib/fetcher'

export async function GET() {
  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
    })
    const res = await eden.generators.list({ visible: true })
    return Response.json({ generators: res.docs })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: 500 },
    )
  }
}
