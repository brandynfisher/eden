'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { Twitter } from 'lucide-react'
import { useMemo, useState } from 'react'

interface TwitterDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
}

export const TwitterDeploymentForm = ({
  agentId,
  deployment,
}: TwitterDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  const handleConnect = () => {
    setIsConnecting(true)

    // OAuth 2.0 flow for Twitter
    const clientId = process.env.NEXT_PUBLIC_TWITTER_INTEGRATIONS_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/auth/integrations/twitter/callback`
    const state = agentId // Pass agent ID as state

    // Twitter OAuth 2.0 authorization URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('client_id', clientId!)
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append(
      'scope',
      'tweet.read tweet.write users.read offline.access',
    )
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('code_challenge', 'challenge')
    authUrl.searchParams.append('code_challenge_method', 'plain')

    // Redirect to Twitter OAuth
    window.location.href = authUrl.toString()
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch(
        `/api/v2/auth/integrations/twitter/disconnect?agentId=${agentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (response.ok) {
        window.location.reload()
      } else {
        console.error('Failed to disconnect Twitter')
      }
    } catch (error) {
      console.error('Error disconnecting Twitter:', error)
    }
  }

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed}
        label="Twitter"
        tooltip="Deploy your agent to Twitter"
        valid={deployment?.valid}
      />
      <CollapsibleContent
        className={cn([
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
            : '',
          isDeployed ? 'border-success' : '',
          deployment?.valid === false ? 'border-destructive' : '',
        ])}
      >
        <div className="flex flex-col w-full space-y-4 p-4">
          {!isDeployed ? (
            <>
              <div className="text-sm text-muted-foreground">
                Connect your Twitter account to enable your agent to post
                tweets, search Twitter, and interact with mentions.
              </div>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
              >
                <Twitter className="mr-2 h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect Twitter Account'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Twitter className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Twitter Connected</div>
                    {deployment?.config?.twitter?.username && (
                      <div className="text-sm text-muted-foreground">
                        @{deployment?.config.twitter.username}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </div>
              {deployment?.valid === false && (
                <div className="text-sm text-destructive">
                  Twitter connection is invalid. Please reconnect your account.
                </div>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
