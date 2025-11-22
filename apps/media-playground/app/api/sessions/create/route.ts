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

  const { agent_ids, context, budget, title, type, status, settings, extras } =
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
    context !== undefined &&
    (typeof context !== 'string' || context.length > 5000)
  ) {
    return new NextResponse(
      JSON.stringify({
        message: 'context must be a string with max 5000 characters',
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

  // Validate type
  if (
    type !== undefined &&
    !['normal', 'natural', 'automatic'].includes(type)
  ) {
    return new NextResponse(
      JSON.stringify({
        message: 'type must be "normal", "natural", or "automatic"',
      }),
      {
        status: 400,
      },
    )
  }

  // Validate status
  if (
    status !== undefined &&
    !['active', 'paused', 'stopped', 'archived'].includes(status)
  ) {
    return new NextResponse(
      JSON.stringify({
        message: 'status must be "active", "paused", "stopped", or "archived"',
      }),
      {
        status: 400,
      },
    )
  }

  // Validate settings
  if (settings !== undefined) {
    if (typeof settings !== 'object') {
      return new NextResponse(
        JSON.stringify({
          message: 'settings must be an object',
        }),
        {
          status: 400,
        },
      )
    }

    if (
      settings.conductor_prompt !== undefined &&
      (typeof settings.conductor_prompt !== 'string' ||
        settings.conductor_prompt.length > 2000)
    ) {
      return new NextResponse(
        JSON.stringify({
          message: 'conductor_prompt must be a string with max 2000 characters',
        }),
        {
          status: 400,
        },
      )
    }

    if (
      settings.delay_interval !== undefined &&
      (typeof settings.delay_interval !== 'number' ||
        settings.delay_interval < 0 ||
        settings.delay_interval > 3600)
    ) {
      return new NextResponse(
        JSON.stringify({
          message: 'delay_interval must be a number between 0 and 3600',
        }),
        {
          status: 400,
        },
      )
    }

    if (
      settings.mention_force_reply !== undefined &&
      typeof settings.mention_force_reply !== 'boolean'
    ) {
      return new NextResponse(
        JSON.stringify({
          message: 'mention_force_reply must be a boolean',
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

    if (context) {
      createArgs.context = context
    }

    if (budget) {
      createArgs.budget = budget
    }

    if (title) {
      createArgs.title = title
    }

    if (type) {
      createArgs.session_type = type
    }

    if (status) {
      createArgs.status = status
    }

    if (settings) {
      createArgs.settings = settings
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
