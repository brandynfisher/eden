import { CONFIG } from '@/lib/config'
import { EdenClient } from '@edenlabs/eden-sdk'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
    })
    const res = await eden.generators.list({ visible: true })
    return Response.json({ generators: res.docs })
  } catch (error) {
    // const errorMessage = handleAxiosServerError(error)
    console.error(error)
    return new Response(JSON.stringify({ message: error?.toString() }), { status: 500 })
  }
}
