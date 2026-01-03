'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { CheckCircle, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({})

type DeploymentFormDto = z.infer<typeof schema>

interface InstagramDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

export const InstagramDeploymentForm = ({
  agentId,
  deployment,
  variant = 'collapsible',
}: InstagramDeploymentFormProps) => {
  const isInline = variant === 'inline'
  const [isOpen, setIsOpen] = useState(isInline ? true : false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const queryClient = useQueryClient()
  const deploymentsQueryKey = ['agents', agentId, 'deployments'] as const
  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {},
  })

  const isDeployed = useMemo(() => deployment !== undefined, [deployment])
  const wasDeployed = useRef(isDeployed)

  useEffect(() => {
    if (isInline) return
    if (wasDeployed.current && !isDeployed) {
      setIsOpen(false)
    }
    wasDeployed.current = isDeployed
  }, [isDeployed, isInline])

  const instagramUsername =
    deployment?.config?.instagram?.username ||
    deployment?.secrets?.instagram?.username

  const isConnected = Boolean(deployment)

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
        event.data.type !== 'instagram-link'
      ) {
        return
      }

      cleanupPopup()

      if (event.data.success) {
        const username =
          event.data.payload?.username || instagramUsername || undefined

        toast.success('Instagram connected', {
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
        toast.error(event.data.message ?? 'Failed to connect Instagram account')
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
  }, [cleanupPopup, deploymentsQueryKey, instagramUsername, queryClient])

  const handleConnect = async () => {
    setIsConnecting(true)

    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/auth/instagram/callback`
    const scope =
      process.env.NEXT_PUBLIC_INSTAGRAM_OAUTH_SCOPES ||
      'instagram_business_basic,instagram_business_content_publish'

    if (!clientId) {
      toast.error('Missing NEXT_PUBLIC_INSTAGRAM_CLIENT_ID')
      setIsConnecting(false)
      return
    }

    const oauthUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=code&scope=${encodeURIComponent(scope)}&state=${agentId}`

    const popup = window.open(
      oauthUrl,
      'instagram-oauth',
      'width=600,height=700,scrollbars=yes',
    )

    if (!popup) {
      window.location.href = oauthUrl
      return
    }

    popupRef.current = popup
  }

  const handleDisconnect = async () => {
    if (!deployment) return
    setIsDisconnecting(true)
    try {
      await axios.delete(`/api/auth/instagram?agentId=${agentId}`)
      toast.success('Instagram disconnected')
      await queryClient.invalidateQueries({
        queryKey: deploymentsQueryKey,
        exact: true,
        refetchType: 'active',
      })
      await queryClient.refetchQueries({
        queryKey: deploymentsQueryKey,
        exact: true,
      })
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to disconnect Instagram',
      )
    } finally {
      setIsDisconnecting(false)
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
        label="Instagram"
        tooltip="Connect Instagram so your agent can publish posts"
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
                      {instagramUsername
                        ? `as @${instagramUsername}`
                        : '(account connected)'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disconnect Instagram
                  </Button>
                </div>
              )}

              {!isConnected && (
                <>
                  <div className="text-sm text-muted-foreground">
                    Connect your Instagram professional (Creator/Business)
                    account so Eden can publish posts to your profile.
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleConnect}
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting…' : 'Connect Instagram Account'}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
