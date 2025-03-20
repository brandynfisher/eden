import {
  createCursorPaginationRoute,
  fetcher,
  handleAxiosServerError,
} from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { CreationV2, PaginatedCursorResponse } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  const { searchParams } = request.nextUrl
  const cursor = searchParams.get('cursor') || undefined

  if (!id) {
    return new NextResponse(JSON.stringify({ message: 'Missing id' }), {
      status: 400,
    })
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  try {
    // const eden = new EdenClient({
    //   edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
    //   token: authToken || undefined,
    // })

    // const res = await eden.collections.getCreationsV2({
    //   collectionId: id,
    // })
    const res = await fetcher<PaginatedCursorResponse<CreationV2>>(
      createCursorPaginationRoute(
        `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/feed-cursor/creations`,
        {
          limit: 3,
          sort: 'createdAt;-1',
          collection: id,
          cursor,
        },
      ),
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    console.log({ ...res, docs: res.docs?.map(doc => doc._id) })

    if (!res) {
      return new NextResponse(
        JSON.stringify({ message: 'Collection not found' }),
        {
          status: 404,
        },
      )
    }

    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
