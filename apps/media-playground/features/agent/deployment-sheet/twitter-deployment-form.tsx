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
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { CheckCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
}

export const TwitterDeploymentForm = ({
  agentId,
  deployment,
}: TwitterDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)

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

  const handleConnect = async () => {
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
      await axios.delete(`/api/auth/integrations/twitter?agentId=${agentId}`)
      toast.success('Twitter account disconnected successfully')
      window.location.reload()
    } catch (error) {
      toast.error('Failed to disconnect Twitter account')
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
                  >
                    Connect Twitter Account
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
