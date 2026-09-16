import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      message:
        'Google Calendar is retired in old Eden. Use new Eden at https://dev.eden.art.',
    },
    { status: 410 },
  )
}
