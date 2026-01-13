'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { openOAuthPopup } from '@/lib/oauth-popup'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { CheckCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
  enableTweet: z.boolean().default(false),
  instructions: z.string().optional(),
})

type DeploymentFormDto = z.infer<typeof schema>

interface TwitterDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

export const TwitterDeploymentForm = ({
  agentId,
  deployment,
  variant = 'collapsible',
}: TwitterDeploymentFormProps) => {
  const isInline = variant === 'inline'
  const [isOpen, setIsOpen] = useState(isInline ? true : false)
  const [isConnecting, setIsConnecting] = useState(false)
  const popupRef = useRef<Window | null>(null)

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      enableTweet: deployment?.config?.twitter?.enable_tweet ?? false,
      instructions: deployment?.config?.twitter?.instructions ?? '',
    },
  })

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  const wasDeployed = useRef(isDeployed)
  useEffect(() => {
    if (isInline) return
    if (wasDeployed.current && !isDeployed) {
      setIsOpen(false)
    }
    wasDeployed.current = isDeployed
  }, [isDeployed, isInline])

  // Reset form when deployment changes
  useEffect(() => {
    if (!isDeployed) {
      form.reset({
        enableTweet: false,
        instructions: '',
      })
    } else {
      form.reset({
        enableTweet: deployment?.config?.twitter?.enable_tweet ?? false,
        instructions: deployment?.config?.twitter?.instructions ?? '',
      })
    }
  }, [
    isDeployed,
    deployment?.config?.twitter?.enable_tweet,
    deployment?.config?.twitter?.instructions,
    form,
  ])

  // Treat any existing deployment as a connected account (tokens are encrypted server-side)
  const isConnected = Boolean(deployment)
  const twitterUsername = deployment?.config?.twitter?.username

  const cleanupPopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    popupRef.current = null
    setIsConnecting(false)
  }, [])

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data.type !== 'twitter-integration-link'
      ) {
        return
      }

      cleanupPopup()

      if (event.data.success) {
        const handle =
          event.data.payload?.twitterHandle || twitterUsername || undefined

        toast.success('Twitter connected', {
          description: handle ? `Connected as @${handle}` : undefined,
        })

        window.location.reload()
      } else {
        toast.error(event.data.message ?? 'Failed to connect Twitter account')
      }
    }

    const interval = window.setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        cleanupPopup()
      }
    }, 500)

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.clearInterval(interval)
      cleanupPopup()
    }
  }, [agentId, cleanupPopup, twitterUsername])

  const handleConnect = async () => {
    setIsConnecting(true)
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
      'tweet.read tweet.write users.read offline.access media.write',
    )
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('code_challenge', 'challenge')
    authUrl.searchParams.append('code_challenge_method', 'plain')

    // Open popup for OAuth (fallback to redirect if blocked)
    const popup = openOAuthPopup({
      name: 'twitter-integration-oauth',
      features: 'width=600,height=700,scrollbars=yes',
      title: 'Connecting to Twitter',
      message: 'Connecting to Twitter...',
    })

    if (!popup) {
      window.location.href = authUrl.toString()
      return
    }

    popup.location.href = authUrl.toString()
    popupRef.current = popup
  }

  const handleDisconnect = async () => {
    try {
      await axios.delete(`/api/auth/integrations/twitter?agentId=${agentId}`)
      toast.success('Twitter account disconnected successfully')
      window.location.reload()
    } catch (error) {
      toast.error('Failed to disconnect Twitter account')
    }
  }

  const open = isInline ? true : isOpen

  return (
    <Collapsible
      className="w-full"
      open={open}
      onOpenChange={value => {
        if (!isInline) setIsOpen(value)
      }}
    >
      <DeploymentCollapsibleTrigger
        isOpen={open}
        isDeployed={isDeployed}
        label="Twitter"
        tooltip="Deploy your agent to Twitter"
        valid={deployment?.valid}
        isStatic={isInline}
      />
      <CollapsibleContent
        className={cn([
          open
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
            : '',
          isDeployed ? 'border-success' : '',
          deployment?.valid === false ? 'border-destructive' : '',
        ])}
      >
        <Form {...form}>
          <form className="flex flex-col w-full space-y-4 p-4">
            <div className="space-y-4">
              {isConnected && (
                <div className="space-y-2">
                  <Label>Connection Status</Label>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      Connected{' '}
                      {twitterUsername ? `as @${twitterUsername}` : ''}
                    </span>
                  </div>
                </div>
              )}

              {!isConnected ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Connect your Twitter account to enable your agent to post
                    tweets, search Twitter, and interact with mentions.
                  </div>
                  <Button
                    type="button"
                    onClick={handleConnect}
                    className="w-full"
                    title="Twitter will use your currently logged-in account. To switch accounts, first log out at twitter.com/logout"
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Twitter Account'}
                  </Button>
                </>
              ) : (
                <>
                  {!isDeployed && (
                    <Button
                      type="button"
                      onClick={handleDisconnect}
                      variant="outline"
                      className="w-full"
                    >
                      Disconnect Twitter Account
                    </Button>
                  )}
                </>
              )}

              {isDeployed && (
                <>
                  <FormField
                    control={form.control}
                    name="enableTweet"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Tweeting
                          </FormLabel>
                          <FormDescription>
                            Enable your agent to tweet on behalf of this Twitter
                            account
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={form.formState.isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch('enableTweet') && (
                    <FormField
                      control={form.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">
                            Tweeting Instructions
                          </FormLabel>
                          <FormDescription>
                            Control how your agent should interact with Twitter
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter tweeting instructions..."
                              className="min-h-[100px] resize-y"
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                  <DeploymentFormFooter
                    agentId={agentId}
                    platform="twitter"
                    form={form}
                    isDeployed={isDeployed}
                    valid={deployment?.valid}
                    guideUrl="https://docs.eden.art/integrations/twitter"
                  />
                </>
              )}
            </div>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
