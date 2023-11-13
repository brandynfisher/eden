// components/DiscordAuthButton.tsx
import { CONFIG } from '@/lib/config'
import { UserContext } from '@/providers/UserProvider'
import { Button } from 'antd'
import React, { useContext } from 'react'

const DiscordAuthButton: React.FC = () => {
  const { userId, user } = useContext(UserContext)
  const handleClick = () => {
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${
      CONFIG.NEXT_PUBLIC_DISCORD_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(
      `${CONFIG.NEXT_PUBLIC_EDEN_API_URL}/auth/discord/callback`,
    )}&response_type=code&scope=identify&state=${userId}`
  }

  return (
    <>
      {user?.discordId ? (
        <div>
          <div className="text-white">Connected with Discord</div>
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
