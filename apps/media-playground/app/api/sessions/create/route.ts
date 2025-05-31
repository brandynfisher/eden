import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient, SessionsV2CreateArguments } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  const { agent_ids, scenario, budget, title } = await request.json()

  // Validation
  if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
    return new NextResponse(
      JSON.stringify({ message: 'agent_ids must be a non-empty array' }),
      {
        status: 400,
      },
    )
  }

  if (
    scenario !== undefined &&
    (typeof scenario !== 'string' || scenario.length > 1000)
  ) {
    return new NextResponse(
      JSON.stringify({
        message: 'scenario must be a string with max 1000 characters',
      }),
      {
        status: 400,
      },
    )
  }

  if (
    budget !== undefined &&
    (typeof budget !== 'number' || budget < 100 || budget > 5000)
  ) {
    return new NextResponse(
      JSON.stringify({
        message: 'budget must be a number between 100 and 5000',
      }),
      {
        status: 400,
      },
    )
  }

  if (
    title !== undefined &&
    (typeof title !== 'string' || title.length > 1000)
  ) {
    return new NextResponse(
      JSON.stringify({
        message: 'title must be a string with max 1000 characters',
      }),
      {
        status: 400,
      },
    )
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const createArgs: SessionsV2CreateArguments = {
      agent_ids,
    }

    if (scenario) {
      createArgs.scenario = scenario
    }

    if (budget) {
      createArgs.budget = budget
    }

    if (title) {
      createArgs.title = title
    }

    const res = await eden.sessions.v2.create(createArgs)

    if (!res.success) {
      return new NextResponse(
        JSON.stringify({
          message: res.message || 'Session creation failed',
        }),
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error('Session creation error:', errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
