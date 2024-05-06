import { EdenClient } from '@edenlabs/eden-sdk'
import { handleAxiosServerError } from '@/lib/fetcher'
import getConfig from 'next/config'

const { serverRuntimeConfig } = getConfig()

export async function GET() {
  try {
    const eden = new EdenClient({
      edenApiUrl: serverRuntimeConfig.API_URL,
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
