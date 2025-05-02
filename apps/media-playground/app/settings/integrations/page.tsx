'use client'

import DiscordAuthButton from '@/components/button/discord-auth-button'
import InstagramAuthButton from '@/components/button/instagram-auth-button'
import TwitterAuthButton from '@/components/button/twitter-auth-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useAuthState } from '@/hooks/use-auth-state'
import { useMe } from '@/hooks/use-me'
import { Loader2 } from 'lucide-react'

const SettingsIntegrationsPage = () => {
  const { isSignedIn } = useAuthState()
  const { user, isLoading } = useMe({ isAuthenticated: !!isSignedIn })

  if (isLoading) {
    return (
      <>
        <TypographyH4>Integrations</TypographyH4>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <TypographyH4>Integrations</TypographyH4>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Discord</CardTitle>
            <CardDescription>
              {user?.discordId
                ? 'Your Discord account is connected. You can disconnect it below.'
                : 'Connect your Discord account to Eden.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DiscordAuthButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>X (Twitter)</CardTitle>
            <CardDescription>
              {user?.twitterHandle ? (
                <>
                  Connected as @{user.twitterHandle}. You can disconnect your X
                  account below.
                </>
              ) : (
                'Connect your X (Twitter) account to Eden.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TwitterAuthButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instagram</CardTitle>
            <CardDescription>
              {user?.instagramHandle ? (
                <>
                  Connected as @{user.instagramHandle}. You can disconnect your
                  Instagram account below.
                </>
              ) : (
                'Connect your Instagram account to Eden.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InstagramAuthButton />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default SettingsIntegrationsPage
