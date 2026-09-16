import { NextResponse } from 'next/server'

// Do not delete saved credentials or revoke the shared Google grant.
export async function DELETE() {
  return NextResponse.json(
    {
      message:
        'Google Calendar is retired in old Eden. Use new Eden at https://dev.eden.art.',
    },
    { status: 410 },
  )
}
