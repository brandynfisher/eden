'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { CheckCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({})

type DeploymentFormDto = z.infer<typeof schema>

interface TiktokDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

export const TiktokDeploymentForm = ({
  agentId,
  deployment,
  variant = 'collapsible',
}: TiktokDeploymentFormProps) => {
  const isInline = variant === 'inline'
  const [isOpen, setIsOpen] = useState(isInline ? true : false)
  const [isConnecting, setIsConnecting] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const queryClient = useQueryClient()
  const deploymentsQueryKey = ['agents', agentId, 'deployments'] as const

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {},
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

  // Treat any existing deployment as connected (secrets are not exposed to frontend)
  const isConnected = Boolean(deployment)
  const tiktokUsername =
    deployment?.config?.tiktok?.username ||
    deployment?.secrets?.tiktok?.username

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
        event.data.type !== 'tiktok-link'
      ) {
        return
      }

      cleanupPopup()

      if (event.data.success) {
        const username =
          event.data.payload?.username || tiktokUsername || undefined

        toast.success('TikTok connected', {
          description: username ? `Connected as @${username}` : undefined,
        })

        await queryClient.invalidateQueries({
          queryKey: deploymentsQueryKey,
          exact: true,
          refetchType: 'active',
        })
        await queryClient.refetchQueries({
          queryKey: deploymentsQueryKey,
          exact: true,
        })
        setIsOpen(true)
      } else {
        toast.error(event.data.message ?? 'Failed to connect TikTok account')
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
  }, [cleanupPopup, deploymentsQueryKey, queryClient, tiktokUsername])

  const handleConnect = async () => {
    setIsConnecting(true)
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY
    const redirectUri = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/auth/tiktok/callback`
    // Need user.info.profile to fetch username; video.publish is for posting
    const scope = 'user.info.basic,user.info.profile,video.publish'

    // Pass agentId in state so OAuth callback knows which agent to associate with
    // Add disable_auto_auth=1 to force account selection even if user was previously authenticated
    const oauthUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&state=${agentId}&disable_auto_auth=1`

    const popup = window.open(
      oauthUrl,
      'tiktok-oauth',
      'width=600,height=700,scrollbars=yes',
    )

    if (!popup) {
      // Popup blocked – fall back to redirect
      window.location.href = oauthUrl
      return
    }

    popupRef.current = popup
  }

  const handleDisconnect = async () => {
    try {
      await axios.delete(`/api/auth/tiktok?agentId=${agentId}`)
      toast.success('TikTok account disconnected successfully')
      await queryClient.invalidateQueries({
        queryKey: deploymentsQueryKey,
        exact: true,
        refetchType: 'active',
      })
      await queryClient.refetchQueries({
        queryKey: deploymentsQueryKey,
        exact: true,
      })
    } catch (error) {
      toast.error('Failed to disconnect TikTok account')
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
        label="TikTok"
        tooltip="Deploy your agent to TikTok"
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
                      {tiktokUsername
                        ? `as @${tiktokUsername}`
                        : '(handle unavailable yet)'}
                    </span>
                  </div>
                </div>
              )}

              {!isConnected ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Connect your TikTok account to enable your agent to post
                    videos and interact with your TikTok audience.
                  </div>
                  <Button
                    type="button"
                    onClick={handleConnect}
                    className="w-full"
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect TikTok Account'}
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
                      Disconnect TikTok Account
                    </Button>
                  )}
                </>
              )}

              {isConnected && (
                <DeploymentFormFooter
                  agentId={agentId}
                  platform="tiktok"
                  form={form}
                  isDeployed={isDeployed}
                  valid={deployment?.valid}
                  guideUrl="https://docs.eden.art/integrations/tiktok"
                />
              )}
            </div>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
