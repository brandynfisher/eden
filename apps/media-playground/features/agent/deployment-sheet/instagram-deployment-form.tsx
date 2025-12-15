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
import { CheckCircle, Clock3 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  // Placeholder for future OAuth/config fields
})

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
              <div className="flex items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                Instagram posting is in progress. UI and models are ready;
                connection flow will arrive soon.
              </div>

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
                </div>
              )}

              {!isConnected && (
                <>
                  <div className="text-sm text-muted-foreground">
                    Link your Instagram account to let your agent post stories
                    and reels. This is a preview-only feature; the connection
                    flow will be enabled shortly.
                  </div>
                  <Button type="button" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </>
              )}

              <DeploymentFormFooter
                agentId={agentId}
                platform="instagram"
                form={form}
                isDeployed={isDeployed}
                valid={deployment?.valid}
                canSubmit={false}
              />
            </div>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
