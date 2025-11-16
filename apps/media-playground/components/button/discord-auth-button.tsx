'use client'

import DiscordIcon from '@/components/icons/discord'
import { Button } from '@/components/ui/button'
import { useAuthState } from '@/hooks/use-auth-state'
import { useMe } from '@/hooks/use-me'
import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const DiscordAuthButton = () => {
  const { isSignedIn } = useAuthState()
  const { user, invalidate } = useMe({ isAuthenticated: !!isSignedIn })
  const [isLoading, setIsLoading] = useState(false)
  const popupRef = useRef<Window | null>(null)

  const cleanupPopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    popupRef.current = null
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let allowedOrigin: string | undefined
    const apiUrl = process.env.NEXT_PUBLIC_EDEN_API_URL
    if (apiUrl) {
      try {
        allowedOrigin = new URL(apiUrl).origin
      } catch (err) {
        console.error('Invalid NEXT_PUBLIC_EDEN_API_URL', err)
      }
    }

    const handleMessage = async (event: MessageEvent) => {
      if (allowedOrigin && event.origin !== allowedOrigin) {
        return
      }
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data.type !== 'discord-link'
      ) {
        return
      }
      cleanupPopup()
      if (event.data.success) {
        await invalidate()
        toast.success('Discord account connected')
      } else {
        toast.error(event.data.message ?? 'Failed to connect Discord account')
      }
    }

    window.addEventListener('message', handleMessage)
    const interval = window.setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        cleanupPopup()
      }
    }, 500)
    return () => {
      window.removeEventListener('message', handleMessage)
      window.clearInterval(interval)
    }
  }, [cleanupPopup, invalidate])

  const handleDiscordConnection = async () => {
    if (user?.discordId) {
      try {
        setIsLoading(true)
        await axios.delete('/api/auth/discord')
        await invalidate()
        toast.success('Discord account disconnected')
      } catch (error) {
        console.error(error)
        toast.error('Failed to disconnect Discord account')
      } finally {
        setIsLoading(false)
      }
    } else {
      if (!user?.userId) {
        return
      }
      const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
      const redirectUri = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/auth/discord/callback`

      const statePayload = JSON.stringify({
        userId: user?.userId,
        mode: 'popup',
      })

      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=code&scope=identify&state=${encodeURIComponent(
        statePayload,
      )}`

      try {
        const popup = window.open(
          discordAuthUrl,
          'discord-oauth',
          'width=500,height=700',
        )

        if (!popup) {
          window.location.href = discordAuthUrl
          return
        }

        popupRef.current = popup
        setIsLoading(true)
      } catch (error) {
        console.error(error)
        toast.error('Failed to open Discord login window')
      }
    }
  }

  const isConnected = Boolean(user?.discordId)

  return (
    <div className="space-y-2">
      {isConnected && (
        <p className="text-sm text-muted-foreground">
          Connected as{' '}
          <span className="font-medium">
            {user?.discordUsername ?? user?.discordId}
          </span>
        </p>
      )}
      <Button
        className="gap-2 w-full sm:w-[250px]"
        onClick={handleDiscordConnection}
        disabled={isLoading}
        variant={'secondary'}
      >
        <DiscordIcon size={16} />
        {isConnected ? 'Disconnect' : 'Connect'} Discord Account
      </Button>
    </div>
  )
}

export default DiscordAuthButton
