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
  await eden.tasks
    .createV2({
      workflow,
      args,
    })
    .then(response => {
      if (!response || response.message) {
        return new Response(
          JSON.stringify({
            message: response.message || 'Internal Error - unknown',
          }),
          {
            status: 500,
          },
        )
      }

      if (response && !response._id) {
        return new Response(
          JSON.stringify({
            message: response.message || `Could not create task`,
          }),
          {
            status: 404,
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

    // const userIdResponse = await axios.get(
    //   `${CONFIG.NEXT_PUBLIC_EDEN_API_URL}/v2/users/own-id`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${authToken}`,
    //     },
    //   },
    // )
    //
    // if (!userIdResponse || !userIdResponse.data || !userIdResponse.data.id) {
    //   return new Response(JSON.stringify({ message: 'Creator not found' }), {
    //     status: 401,
    //   })
    // }

    // const modalRequest = {
    //   endpoint: CONFIG.EDEN_COMPUTE_API_URL,
    //   data: {
    //     workflow: requestJson.workflow,
    //     user: userIdResponse.data.id,
    //     args: requestJson.args,
    //   },
    // }

    // console.log('> modal::request', modalRequest)
    //
    // const res = await axios.post(modalRequest.endpoint, modalRequest.data, {
    //   headers: {
    //     Authorization: `Bearer ${CONFIG.EDEN_COMPUTE_API_KEY}`,
    //   },
    // })
    //
    // if (!res || !res.data) {
    //   return new Response(
    //     JSON.stringify({ message: 'Invalid modal response' }),
    //     {
    //       status: 500,
    //     },
    //   )
    // }
    return createTask(requestJson.workflow, requestJson.args, eden)
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
