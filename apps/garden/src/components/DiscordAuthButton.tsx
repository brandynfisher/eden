import SvgDiscord from '@/components/Layout/icons/DiscordIcon'
import { CONFIG } from '@/lib/config'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext } from 'react'
import { sendGTMEvent } from '@next/third-parties/google'

const DiscordAuthButton: React.FC = () => {
  const { message } = App.useApp()
  const { userId, user, refetchMe, maybeAuthenticate } = useContext(UserContext)
  const handleClick = async () => {
    if (!(await maybeAuthenticate())) return

    try {
      sendGTMEvent({
        event: 'discord-connect',
        event_callback: () => {
          window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${
            CONFIG.NEXT_PUBLIC_DISCORD_CLIENT_ID
          }&redirect_uri=${encodeURIComponent(
            `${CONFIG.NEXT_PUBLIC_EDEN_API_URL}/auth/discord/callback`,
          )}&response_type=code&scope=identify&state=${userId}`
        },
        eventTimeout : 2000
      })
    } catch (err) {
      handleAxiosError(err, message)
    }
  }

  const handleDisconnect = async () => {
    if (!(await maybeAuthenticate())) return

    try {
      await axios.get('/api/auth/discord/disconnect')
      refetchMe()
      sendGTMEvent({
        event: 'discord-disconnect',
      })
    } catch (err) {
      handleAxiosError(err, message)
    }
  }

  return (
    <>
      {user?.discordId ? (
        <div className="flex flex-col justify-center">
          <div className="mb-2">Linked {user?.discordId}</div>
          <Button
            danger
            type="dashed"
            className="font-mono h-10"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <Button
          className="font-mono h-10 flex items-center gap-3"
          onClick={handleClick}
        >
          <SvgDiscord />
          <span>Connect with Discord</span>
        </Button>
      )}
    </>
  )
}

export default DiscordAuthButton
