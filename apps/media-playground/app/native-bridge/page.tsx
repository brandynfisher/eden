'use client'

import { useAuth, useSignIn } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

type Status = 'pending' | 'done' | 'error'

export const dynamic = 'force-dynamic'

export default function NativeBridgePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { isLoaded, signIn, setActive } = useSignIn()
  const hasAttempted = useRef(false)

  const token = useMemo(() => searchParams.get('token'), [searchParams])
  const returnTo = useMemo(
    () => searchParams.get('return') ?? '/',
    [searchParams],
  )

  const [status, setStatus] = useState<Status>('pending')
  const [message, setMessage] = useState('Completing sign in...')

  useEffect(() => {
    if (!isLoaded) return
    if (!token) {
      setStatus('error')
      setMessage('Missing token')
      return
    }

    // Already signed in, just bounce to the requested page
    if (isSignedIn) {
      router.replace(returnTo)
      return
    }

    if (hasAttempted.current) return
    hasAttempted.current = true

    const completeSignIn = async () => {
      try {
        const result = await signIn?.create({
          strategy: 'ticket',
          ticket: token,
        })

        if (result?.status === 'complete') {
          await setActive?.({ session: result.createdSessionId })
          setStatus('done')
          router.replace(returnTo)
        } else {
          setStatus('error')
          setMessage('Unable to complete sign-in')
        }
      } catch (error) {
        console.error('native-bridge sign-in failed', error)
        setStatus('error')
        setMessage('Sign-in failed')
      }
    }

    completeSignIn()
  }, [isLoaded, token, isSignedIn, returnTo, router, signIn, setActive])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-950 px-6 text-center text-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-gray-900 p-6 shadow-lg shadow-black/30">
        <h1 className="text-lg font-semibold">Signing you in…</h1>
        <p className="mt-2 text-sm text-gray-300">{message}</p>
        {status === 'pending' && (
          <div className="mt-4 flex justify-center" aria-label="loading">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
          </div>
        )}
        {status === 'error' && (
          <p className="mt-4 text-sm text-red-400">
            Please close this window and try signing in again from the app.
          </p>
        )}
      </div>
    </main>
  )
}
