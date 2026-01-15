'use client'

import { useEffect, useMemo, useState } from 'react'

const buildDeepLink = (searchParams: URLSearchParams) => {
  const query = searchParams.toString()
  return `edenmobile://oauth/callback${query ? `?${query}` : ''}`
}

export default function OAuthCallbackPage() {
  const [hasAttempted, setHasAttempted] = useState(false)

  const deepLink = useMemo(() => {
    if (typeof window === 'undefined') return 'edenmobile://oauth/callback'
    return buildDeepLink(new URLSearchParams(window.location.search))
  }, [])

  useEffect(() => {
    if (hasAttempted) return
    setHasAttempted(true)

    const timer = setTimeout(() => {
      window.location.href = deepLink
    }, 300)

    return () => clearTimeout(timer)
  }, [deepLink, hasAttempted])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="text-2xl font-semibold">
          Open Eden to finish sign in
        </div>
        <p className="text-muted-foreground">
          If the Eden app doesn&apos;t open automatically, tap the button below.
        </p>
        <a
          href={deepLink}
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-primary-foreground font-medium"
        >
          Open Eden
        </a>
        <p className="text-xs text-muted-foreground">
          You can close this tab once the app opens.
        </p>
      </div>
    </div>
  )
}
