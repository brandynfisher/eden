import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { EdenClient, Task } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { NextRequest } from 'next/server'

const createTask = async (
  workflow: string,
  args: Task['config'],
  eden: EdenClient,
) => {
  return eden.tasks
    .createV2({
      workflow,
      args,
    })
    .then(response => {
      if (!response || response.message) {
        return new Response(
          JSON.stringify({
            message: response.message || 'Internal Error - unknown reason',
          }),
          {
            status: 500,
          },
        )
      }

      if (response && !response._id) {
        return new Response(
          JSON.stringify({
            message:
              response.message ||
              `Could not create task - invalid compute response`,
          }),
          {
            status: 500,
          },
        )
      }

      return Response.json(response.task)
    })
    .catch(error => {
      return new Response(
        JSON.stringify({
          message:
            error?.response?.data?.message ||
            error.response.statusText ||
            'Internal Exception',
          error:
            process.env.NEXT_PUBLIC_APP_ENV === 'production'
              ? '- redacted -'
              : error,
        }),
        {
          status: error.response.status || 500,
        },
      )
    })
}

export async function POST(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new Response(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  const requestJson = await request.json()

  if (!requestJson) {
    return new Response(JSON.stringify({ message: 'No data passed' }), {
      status: 401,
    })
  }

  if (!requestJson.workflow) {
    return new Response(JSON.stringify({ message: 'Missing workflow name' }), {
      status: 401,
    })
  }

  if (!requestJson.args) {
    return new Response(JSON.stringify({ message: 'Missing generator args' }), {
      status: 401,
    })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const createdTaskResponse = await createTask(
      requestJson.workflow,
      requestJson.args,
      eden,
    )
    const createdTaskJson = await createdTaskResponse.json()

    console.log(createdTaskJson)

    if (createdTaskResponse.status !== 200) {
      return new Response(
        JSON.stringify({
          message: createdTaskJson.message || 'Error creating task',
        }),
        {
          status: 500,
        },
      )
    }

    return Response.json(createdTaskJson)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response && error.response.data) {
        return new Response(JSON.stringify({ message: error.response.data }), {
          status: 500,
        })
      }
    }

    return new Response(JSON.stringify({ message: error }), {
      status: 500,
    })
  }
}
