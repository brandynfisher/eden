'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form } from '@/components/ui/form'
import { ChannelsField } from '@/features/agent/deployment-sheet/channels-field'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  token: z.string(),
  allowedChannels: z.array(
    z.object({
      id: z.string(),
      note: z.string().optional(),
    }),
  ),
})

type DeploymentFormDto = z.infer<typeof schema>

interface DiscordDeploymentFormProps {
  agentId: string
  isDeployed?: boolean
}

export const DiscordDeploymentForm = ({
  agentId,
  isDeployed,
}: DiscordDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: '',
      allowedChannels: [],
    },
  })

  const allowedChannels = useFieldArray({
    control: form.control,
    name: 'allowedChannels',
  })

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed ?? false}
        label="Discord"
        tooltip="Deploy your agent to Discord"
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
              name="token"
              isDeployed={isDeployed ?? false}
              label="Token"
              description="Your Discord bot token."
            />
            <ChannelsField form={form} allowedChannels={allowedChannels} />
            <DeploymentFormFooter
              agentId={agentId}
              platform="discord"
              form={form}
              isDeployed={isDeployed ?? false}
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
