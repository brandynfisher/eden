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

  const { agent_ids, scenario, budget, title, autonomy_settings, extras } =
    await request.json()

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

  // Updated budget validation
  if (budget !== undefined) {
    if (typeof budget !== 'object') {
      return new NextResponse(
        JSON.stringify({
          message: 'budget must be an object',
        }),
        {
          status: 400,
        },
      )
    }

    if (
      budget.manna_budget !== undefined &&
      (typeof budget.manna_budget !== 'number' ||
        budget.manna_budget < 100 ||
        budget.manna_budget > 50000)
    ) {
      return new NextResponse(
        JSON.stringify({
          message: 'manna_budget must be a number between 100 and 50000',
        }),
        {
          status: 400,
        },
      )
    }

    if (
      budget.token_budget !== undefined &&
      (typeof budget.token_budget !== 'number' ||
        budget.token_budget < 1000 ||
        budget.token_budget > 1000000)
    ) {
      return new NextResponse(
        JSON.stringify({
          message: 'token_budget must be a number between 1000 and 1000000',
        }),
        {
          status: 400,
        },
      )
    }

    if (
      budget.turn_budget !== undefined &&
      (typeof budget.turn_budget !== 'number' ||
        budget.turn_budget < 1 ||
        budget.turn_budget > 1000)
    ) {
      return new NextResponse(
        JSON.stringify({
          message: 'turn_budget must be a number between 1 and 1000',
        }),
        {
          status: 400,
        },
      )
    }
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

  // Validate autonomy_settings
  if (autonomy_settings !== undefined) {
    if (typeof autonomy_settings !== 'object') {
      return new NextResponse(
        JSON.stringify({
          message: 'autonomy_settings must be an object',
        }),
        {
          status: 400,
        },
      )
    }

    if (
      autonomy_settings.auto_reply !== undefined &&
      typeof autonomy_settings.auto_reply !== 'boolean'
    ) {
      return new NextResponse(
        JSON.stringify({
          message: 'auto_reply must be a boolean',
        }),
        {
          status: 400,
        },
      )
    }

    if (
      autonomy_settings.reply_interval !== undefined &&
      (typeof autonomy_settings.reply_interval !== 'number' ||
        autonomy_settings.reply_interval < 0 ||
        autonomy_settings.reply_interval > 3600)
    ) {
      return new NextResponse(
        JSON.stringify({
          message: 'reply_interval must be a number between 0 and 3600',
        }),
        {
          status: 400,
        },
      )
    }

    if (
      autonomy_settings.actor_selection_method !== undefined &&
      !['random', 'random_exclude_last'].includes(
        autonomy_settings.actor_selection_method,
      )
    ) {
      return new NextResponse(
        JSON.stringify({
          message:
            'actor_selection_method must be "random" or "random_exclude_last"',
        }),
        {
          status: 400,
        },
      )
    }
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

    if (autonomy_settings) {
      createArgs.autonomy_settings = autonomy_settings
    }

    if (extras) {
      createArgs.extras = extras
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
