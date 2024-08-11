import SvgDiscord from '@/components/Layout/icons/DiscordIcon'
import { CONFIG } from '@/lib/config'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import LoadingOutlined from '@ant-design/icons/LoadingOutlined'
import { sendGTMEvent } from '@next/third-parties/google'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const DiscordAuthButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { message } = App.useApp()
  const { userId, user, refetchMe, maybeAuthenticate } = useContext(UserContext)
  const handleClick = async () => {
    if (!(await maybeAuthenticate())) return
    setIsLoading(true)
    console.log('discord-connect')

    try {
      sendGTMEvent({
        event: 'discord-connect',
        eventCallback: () => {
          setIsLoading(false)
          window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${
            CONFIG.NEXT_PUBLIC_DISCORD_CLIENT_ID
          }&redirect_uri=${encodeURIComponent(
            `${CONFIG.NEXT_PUBLIC_EDEN_API_URL}/auth/discord/callback`,
          )}&response_type=code&scope=identify&state=${userId}`
        },
        eventTimeout: 1000,
      })
    } catch (err) {
      setIsLoading(false)
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
          onClick={!isLoading ? handleClick : undefined}
          disabled={isLoading}
        >
          {isLoading ? <LoadingOutlined /> : null}
          <SvgDiscord />
          <span>Connect with Discord</span>
        </Button>
      )}
    </>
  )
}

export default DiscordAuthButton
