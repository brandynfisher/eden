'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form } from '@/components/ui/form'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  api_key: z.string(),
})

type DeploymentFormDto = z.infer<typeof schema>

interface CaptionsDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

export const CaptionsDeploymentForm = ({
  agentId,
  deployment,
  variant = 'collapsible',
}: CaptionsDeploymentFormProps) => {
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
        label="Captions AI"
        tooltip="Deploy your agent to generate AI-powered advertisement videos"
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
            <TokenField
              form={form}
              name="api_key"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="API Key"
              description="Your Captions AI API key. You can find this in your Captions account settings."
            />
            <DeploymentFormFooter
              agentId={agentId}
              platform="captions"
              form={form}
              isDeployed={isDeployed}
              valid={deployment?.valid}
              guideUrl="https://docs.eden.art/integrations/captions"
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
