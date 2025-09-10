'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  mnemonic: z.string(),
  autoReply: z.boolean().default(true),
})

type DeploymentFormDto = z.infer<typeof schema>

interface FarcasterDeploymentFormProps {
  agentId: string
  deployment?: Deployment
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
      autoReply: deployment?.config?.farcaster?.auto_reply ?? true,
    },
  })

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed ?? false}
        label="Farcaster"
        tooltip="Deploy your agent to Farcaster"
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
            <TokenField
              form={form}
              name="mnemonic"
              isDeployed={isDeployed ?? false}
              label="Mnemonic"
              description="Your Farcaster mnemonic."
              isSubmitting={form.formState.isSubmitting}
              placeholder="Enter mnemonic"
            />
            <FormField
              control={form.control}
              name="autoReply"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto Reply</FormLabel>
                    <FormDescription>
                      Automatically reply to mentions and casts
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DeploymentFormFooter
              form={form}
              agentId={agentId}
              platform="farcaster"
              isDeployed={isDeployed ?? false}
              valid={deployment?.valid}
              guideUrl="https://docs.eden.art/docs/guides/farcaster"
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
