'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form } from '@/components/ui/form'
import { ChannelsField } from '@/features/agent/deployment-sheet/channels-field'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  token: z.string(),
  allowedTopics: z.array(
    z.object({
      id: z.string(),
      note: z.string().optional(),
    }),
  ),
})

type DeploymentFormDto = z.infer<typeof schema>

interface TelegramDeploymentFormProps {
  agentId: string
  deployment?: Deployment
}

export const TelegramDeploymentForm = ({
  agentId,
  deployment,
}: TelegramDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: '',
      allowedTopics: deployment?.config?.telegram?.topic_allowlist ?? [],
    },
  })

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  const allowedTopics = useFieldArray({
    control: form.control,
    name: 'allowedTopics',
  })

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed ?? false}
        label="Telegram"
        tooltip="Deploy your agent to Telegram"
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
              description="Your Telegram bot token."
            />
            <ChannelsField
              form={form}
              name="allowedTopics"
              allowList={allowedTopics}
              label="Allowed Topics"
              description="The topics your agent will be deployed to. If you want to deploy to
          all topics, leave the list empty."
            />
            <DeploymentFormFooter
              form={form}
              agentId={agentId}
              platform="telegram"
              isDeployed={isDeployed ?? false}
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
