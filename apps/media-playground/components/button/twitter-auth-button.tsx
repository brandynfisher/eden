'use client'

import TwitterIcon from '@/components/icons/twitter'
import { Button } from '@/components/ui/button'
import { useAuthState } from '@/hooks/use-auth-state'
import { useMe } from '@/hooks/use-me'
import { env } from '@/lib/config'
import axios from 'axios'
import { useState } from 'react'

const TwitterAuthButton = () => {
  const { isSignedIn } = useAuthState()
  const { user, invalidate } = useMe({ isAuthenticated: !!isSignedIn })
  const [isLoading, setIsLoading] = useState(false)

  const handleTwitterConnection = async () => {
    if (user?.twitterHandle) {
      setIsLoading(true)
      await axios.delete('/api/auth/twitter')
      await invalidate()
      setIsLoading(false)
    } else {
      const clientId = env.NEXT_PUBLIC_TWITTER_CLIENT_ID
      const redirectUri = `${env.NEXT_PUBLIC_EDEN_API_URL}/v2/auth/twitter/callback`

      window.location.href = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&scope=users.read%20tweet.read&state=${
        user?.userId
      }&code_challenge=challenge&code_challenge_method=plain`
    }
  }

  return (
    <Button
      className="gap-2"
      onClick={handleTwitterConnection}
      disabled={isLoading}
      variant={'secondary'}
    >
      <TwitterIcon size={16} />
      {user?.twitterHandle ? 'Disconnect' : 'Connect'} X Account
    </Button>
  )
}

export default TwitterAuthButton
