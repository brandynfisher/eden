import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient, GeneratorParameterV2 } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

function replaceNullWithUndefined(
  arr: GeneratorParameterV2[],
): GeneratorParameterV2[] {
  return arr.map(item => {
    const newItem: GeneratorParameterV2 = { ...item }

    for (const key of Object.keys(newItem) as Array<
      keyof GeneratorParameterV2
    >) {
      if (newItem[key] === null || newItem[key] === 'random') {
        switch (key) {
          case 'default':
          case 'minimum':
          case 'maximum':
          case 'min_length':
          case 'max_length':
            newItem[key] = undefined
            break
          default:
            break
        }
      }
    }

    return newItem
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { key: string } },
) {
  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
    })

    const res = await eden.generators.getV2({ generatorKey: params.key })
    const transformedParameters = res.generator?.parameters
      ? replaceNullWithUndefined(res.generator?.parameters)
      : []
    return NextResponse.json({
      generator: { ...res.generator, parameters: transformedParameters },
    })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
