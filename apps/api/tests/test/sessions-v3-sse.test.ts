import { describe, expect, it } from 'vitest'

const parseSseLines = (input: string) => {
  const events: Array<{ event: string; data: any }> = []
  const lines = input.split('\n')
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue
    const payload = line.slice(6).trim()
    if (!payload) continue
    events.push(JSON.parse(payload))
  }
  return events
}

describe('sessions-v3 SSE parsing', () => {
  it('parses update/done/error lines', () => {
    const sse =
      'data: {"event":"update","data":{"type":"assistant_token","text":"hi"}}\n\n' +
      'data: {"event":"done","data":""}\n\n' +
      'data: {"event":"error","data":{"error":"boom"}}\n\n'

    const events = parseSseLines(sse)
    expect(events).toHaveLength(3)
    expect(events[0].event).toBe('update')
    expect(events[1].event).toBe('done')
    expect(events[2].data.error).toBe('boom')
  })

  it('ignores non-data lines', () => {
    const sse =
      'event: update\nretry: 1000\ndata: {"event":"update","data":{}}\n\n'
    const events = parseSseLines(sse)
    expect(events).toHaveLength(1)
  })
})
