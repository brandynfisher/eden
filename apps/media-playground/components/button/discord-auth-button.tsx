'use client'

import DiscordIcon from '@/components/icons/discord'
import { Button } from '@/components/ui/button'
import { useMe } from '@/hooks/use-me'
import { env } from '@/lib/config'
import axios from 'axios'
import React from 'react'

const DiscordAuthButton = () => {
  const { user, invalidate } = useMe({ isAuthenticated: true })
  const [isLoading, setIsLoading] = React.useState(false)

  const handleDiscordConnection = async () => {
    if (user?.discordId) {
      setIsLoading(true)
      await axios.delete('/api/auth/discord')
      await invalidate()
      setIsLoading(false)
    } else {
      const clientId = env.NEXT_PUBLIC_DISCORD_CLIENT_ID
      const redirectUri = env.NEXT_PUBLIC_EDEN_API_URL
      const scope = 'identify email'
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=code&scope=${scope}`

      window.location.href = discordAuthUrl
    }
  }

  return (
    <Button
      className="gap-2"
      onClick={handleDiscordConnection}
      disabled={isLoading}
      variant={'secondary'}
    >
      <DiscordIcon size={24} />
      {user?.discordId ? 'Disconnect' : 'Connect'} Discord Account
    </Button>
  )
}

export default DiscordAuthButton
