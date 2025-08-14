'use client'

import { Button } from '@/components/ui/button'
import axios from 'axios'
import { useState } from 'react'

interface TiktokAuthButtonProps {
  agentId: string
  isConnected?: boolean
}

const TiktokAuthButton = ({ agentId, isConnected }: TiktokAuthButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleTiktokConnection = async () => {
    if (isConnected) {
      setIsLoading(true)
      await axios.delete(`/api/auth/tiktok?agentId=${agentId}`)
      setIsLoading(false)
      window.location.reload()
    } else {
      const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY
      const redirectUri = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/auth/tiktok/callback`
      const scope = 'user.info.basic,video.publish'

      // Redirect to OAuth
      window.location.href = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&state=${agentId}`
    }
  }

  return (
    <Button
      className="gap-2 w-full sm:w-[250px]"
      onClick={handleTiktokConnection}
      disabled={isLoading}
      variant={'secondary'}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
      {isConnected ? 'Disconnect' : 'Connect'} TikTok
    </Button>
  )
}

export default TiktokAuthButton
