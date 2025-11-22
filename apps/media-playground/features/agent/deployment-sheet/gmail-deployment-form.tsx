'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { cn } from '@/lib/utils'
import { Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  replyDelayMinimum: z.coerce.number().min(0, 'Must be zero or greater'),
  replyDelayVariance: z.coerce.number().min(0, 'Must be zero or greater'),
  emailInstructions: z.string().max(5000).optional(),
})

type GmailDeploymentFormSchema = z.infer<typeof schema>

interface GmailDeploymentFormProps {
  agentId: string
  deployment?: Deployment
}

export const GmailDeploymentForm = ({
  agentId,
  deployment,
}: GmailDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const isDeployed = useMemo(() => deployment !== undefined, [deployment])

  const wasDeployed = useRef(isDeployed)
  useEffect(() => {
    if (wasDeployed.current && !isDeployed) {
      setIsOpen(false)
    }
    wasDeployed.current = isDeployed
  }, [isDeployed])

  const form = useForm<GmailDeploymentFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      replyDelayMinimum: deployment?.config?.gmail?.reply_delay_minimum ?? 0,
      replyDelayVariance: deployment?.config?.gmail?.reply_delay_variance ?? 0,
      emailInstructions: deployment?.config?.gmail?.email_instructions ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      replyDelayMinimum: deployment?.config?.gmail?.reply_delay_minimum ?? 0,
      replyDelayVariance: deployment?.config?.gmail?.reply_delay_variance ?? 0,
      emailInstructions: deployment?.config?.gmail?.email_instructions ?? '',
    })
  }, [deployment, form])

  if (!deployment) {
    return null
  }

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed}
        label="Gmail"
        tooltip="Configure Gmail reply behaviour"
        valid={deployment.valid}
      />
      <CollapsibleContent
        className={cn(
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-4 p-4'
            : '',
          isDeployed ? 'border-success' : '',
          deployment.valid === false ? 'border-destructive' : '',
        )}
      >
        <Form {...form}>
          <form className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <p>
                Gmail deployments are managed privately. You can only edit
                response timing and instructions for existing deployments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="replyDelayMinimum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Delay (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={
                          typeof field.value === 'number' &&
                          !Number.isNaN(field.value)
                            ? field.value
                            : ''
                        }
                        onChange={event =>
                          field.onChange(event.currentTarget.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Base delay before a reply is attempted. Actual delay is
                      scaled by email length.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="replyDelayVariance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variance (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={
                          typeof field.value === 'number' &&
                          !Number.isNaN(field.value)
                            ? field.value
                            : ''
                        }
                        onChange={event =>
                          field.onChange(event.currentTarget.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Additional randomized delay applied to longer emails.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="emailInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Provide any custom guidance for Gmail replies."
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    These instructions are injected into the trigger context so
                    the agent can follow bespoke guidance when replying.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DeploymentFormFooter
              form={form}
              agentId={agentId}
              platform="gmail"
              isDeployed={isDeployed}
              canSubmit={isDeployed}
              valid={deployment.valid}
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
