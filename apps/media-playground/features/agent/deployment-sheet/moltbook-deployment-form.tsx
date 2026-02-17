'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form } from '@/components/ui/form'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  api_key: z.string(),
})

type DeploymentFormDto = z.infer<typeof schema>

interface MoltbookDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

export const MoltbookDeploymentForm = ({
  agentId,
  deployment,
  variant = 'collapsible',
}: MoltbookDeploymentFormProps) => {
  const isInline = variant === 'inline'
  const [isOpen, setIsOpen] = useState(isInline ? true : false)

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      api_key: '',
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
        label="Moltbook"
        tooltip="Connect your Moltbook account to deploy your agent on the Moltbook network"
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
            {!isDeployed && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Register your agent on Moltbook, then verify your email and
                  Twitter to claim it. Once claimed, copy your API key from the
                  dashboard below.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href="https://www.moltbook.com/login"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Moltbook Dashboard
                  </a>
                </Button>
              </div>
            )}
            <TokenField
              form={form}
              name="api_key"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="Moltbook API Key"
              description="Paste the API key from your Moltbook dashboard."
            />
            <DeploymentFormFooter
              agentId={agentId}
              platform="moltbook"
              form={form}
              isDeployed={isDeployed}
              valid={deployment?.valid}
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
