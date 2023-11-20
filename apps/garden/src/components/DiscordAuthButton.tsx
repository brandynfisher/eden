// components/DiscordAuthButton.tsx
import { CONFIG } from '@/lib/config'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext } from 'react'

const DiscordAuthButton: React.FC = () => {
  const { message } = App.useApp()
  const { userId, user, refetchMe } = useContext(UserContext)
  const handleClick = () => {
    try {
      window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${
        CONFIG.NEXT_PUBLIC_DISCORD_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        `${CONFIG.NEXT_PUBLIC_EDEN_API_URL}/auth/discord/callback`,
      )}&response_type=code&scope=identify&state=${userId}`
    } catch (err) {
      handleAxiosError(err, message)
    }
  }

  const handleDisconnect = async () => {
    try {
      await axios.get('/api/auth/discord/disconnect')
      refetchMe()
    } catch (err) {
      handleAxiosError(err, message)
    }
  }

  return (
    <>
      {user?.discordId ? (
        <div>
          <div className="text-white">Connected with Discord</div>
          <Button
            className="font-mono bg-black text-white h-10"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <Button
          className="font-mono bg-black text-white h-10"
          onClick={handleClick}
        >
          Connect with Discord
        </Button>
      )}
    </>
  )
}

export default DiscordAuthButton
