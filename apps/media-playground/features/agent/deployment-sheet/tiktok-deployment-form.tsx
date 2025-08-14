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
import axios from 'axios'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({})

type DeploymentFormDto = z.infer<typeof schema>

interface TiktokDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
}

export const TiktokDeploymentForm = ({
  agentId,
  deployment,
}: TiktokDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {},
  })

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  // Check if TikTok is connected by looking at deployment secrets
  const isConnected = deployment?.secrets?.tiktok?.access_token ? true : false
  const tiktokUsername = deployment?.secrets?.tiktok?.username

  const handleConnect = async () => {
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY
    const redirectUri = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/auth/tiktok/callback`
    const scope = 'user.info.basic,video.publish'

    // Pass agentId in state so OAuth callback knows which agent to associate with
    window.location.href = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&state=${agentId}`
  }

  const handleDisconnect = async () => {
    try {
      await axios.delete(`/api/auth/tiktok?agentId=${agentId}`)
      toast.success('TikTok account disconnected successfully')
      // Refresh the page to update deployment status
      window.location.reload()
    } catch (error) {
      toast.error('Failed to disconnect TikTok account')
    }
  }

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed}
        label="TikTok"
        tooltip="Deploy your agent to TikTok"
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
              <div className="space-y-2">
                <Label>Connection Status</Label>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">
                        Connected{' '}
                        {tiktokUsername ? `as @${tiktokUsername}` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Not connected</span>
                    </>
                  )}
                </div>
              </div>

              {!isConnected ? (
                <Button
                  type="button"
                  onClick={handleConnect}
                  className="w-full"
                >
                  Connect TikTok Account
                </Button>
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
                  guideUrl="https://docs.eden.art/docs/guides/tiktok/"
                />
              )}
            </div>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
