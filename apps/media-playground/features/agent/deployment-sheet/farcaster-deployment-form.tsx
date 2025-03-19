'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form } from '@/components/ui/form'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { AgentsGetDeploymentsResponse } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  mnemonic: z.string(),
  neynarWebhookSecret: z.string(),
})

type DeploymentFormDto = z.infer<typeof schema>

interface FarcasterDeploymentFormProps {
  agentId: string
  deployment?: AgentsGetDeploymentsResponse['deployments']['farcaster']
}

export const FarcasterDeploymentForm = ({
  agentId,
  deployment,
}: FarcasterDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      mnemonic: '',
      neynarWebhookSecret: '',
    },
  })

  const isDeployed = useMemo(() => {
    return deployment
  }, [deployment])

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed ?? false}
        label="Farcaster"
        tooltip="Deploy your agent to Farcaster"
      />
      <CollapsibleContent
        className={cn([
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
            : '',
          isDeployed ? 'border-success' : '',
        ])}
      >
        <Form {...form}>
          <form className="flex flex-col w-full space-y-4 p-4">
            <TokenField
              form={form}
              name="mnemonic"
              isDeployed={isDeployed ?? false}
              label="Mnemonic"
              description="Your Farcaster mnemonic."
              isSubmitting={form.formState.isSubmitting}
            />
            <TokenField
              form={form}
              name="neynarWebhookSecret"
              isDeployed={isDeployed ?? false}
              label="Neynar Webhook Secret"
              description="Your Neynar webhook secret."
              isSubmitting={form.formState.isSubmitting}
            />
            <DeploymentFormFooter
              form={form}
              agentId={agentId}
              platform="farcaster"
              isDeployed={isDeployed ?? false}
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
