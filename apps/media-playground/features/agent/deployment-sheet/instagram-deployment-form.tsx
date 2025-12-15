'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { CheckCircle, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({})

type DeploymentFormDto = z.infer<typeof schema>

interface InstagramDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
}

export const InstagramDeploymentForm = ({
  agentId,
  deployment,
}: InstagramDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const queryClient = useQueryClient()
  const deploymentsQueryKey = ['agents', agentId, 'deployments'] as const
  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {},
  })

  const isDeployed = useMemo(() => deployment !== undefined, [deployment])
  const wasDeployed = useRef(isDeployed)

  useEffect(() => {
    if (wasDeployed.current && !isDeployed) {
      setIsOpen(false)
    }
    wasDeployed.current = isDeployed
  }, [isDeployed])

  const instagramUsername =
    deployment?.config?.instagram?.username ||
    deployment?.secrets?.instagram?.username

  const isConnected = Boolean(deployment)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await axios.post(`/api/agents/${agentId}/deployments`, {
        platform: 'instagram',
      })
      toast.success('Instagram connected (shared token)')
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
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to connect Instagram',
      )
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!deployment) return
    setIsDisconnecting(true)
    try {
      await axios.delete(`/api/agents/${agentId}/deployments`, {
        data: { platform: 'instagram' },
      })
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

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed}
        label="Instagram"
        tooltip="Deploy your agent to Instagram (coming soon)"
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
              <Alert className="border border-blue-500/30 bg-blue-500/5">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <AlertTitle className="text-sm font-medium">
                  Staging connection
                </AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  For now this uses the shared staging Instagram token from
                  server env. Deploying will wire your agent to that account.
                </AlertDescription>
              </Alert>

              {isConnected && (
                <div className="space-y-2">
                  <Label>Connection Status</Label>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      Connected{' '}
                      {instagramUsername
                        ? `as @${instagramUsername}`
                        : '(handle unavailable yet)'}
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
                    Disconnect
                  </Button>
                </div>
              )}

              {!isConnected && (
                <>
                  <div className="text-sm text-muted-foreground">
                    Connect to the shared staging Instagram token. Dedicated
                    per-user OAuth will ship after review.
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleConnect}
                    disabled={isConnecting}
                  >
                    {isConnecting
                      ? 'Connecting…'
                      : 'Use shared Instagram connection'}
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
