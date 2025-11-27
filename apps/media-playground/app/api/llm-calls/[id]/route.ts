import { env } from '@/lib/config'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const apiUrl = `${env.NEXT_PUBLIC_EDEN_API_URL}/v2/llm-calls/${id}`

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: error || 'Failed to fetch LLM call' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[LLM Call API] Error fetching LLM call:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LLM call' },
      { status: 500 },
    )
  }
}
