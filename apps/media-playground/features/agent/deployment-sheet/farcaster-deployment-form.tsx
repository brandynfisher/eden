'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
  authMethod: z.enum(['mnemonic', 'managed_signer']).default('managed_signer'),
  mnemonic: z.string().optional(),
  signerUuid: z.string().optional(),
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
  const [signerApprovalUrl, setSignerApprovalUrl] = useState<string>('')
  const [signerStatus, setSignerStatus] = useState<string>('')
  const [isCreatingSigner, setIsCreatingSigner] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null)

  const hasExistingMnemonic = deployment?.secrets?.farcaster?.mnemonic
  const hasExistingSignerUuid = deployment?.secrets?.farcaster?.signer_uuid

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      authMethod: hasExistingSignerUuid
        ? 'managed_signer'
        : hasExistingMnemonic
        ? 'mnemonic'
        : 'managed_signer',
      mnemonic: '',
      signerUuid: hasExistingSignerUuid || '',
      autoReply: deployment?.config?.farcaster?.auto_reply ?? true,
    },
  })

  const authMethod = form.watch('authMethod')
  const currentSignerUuid = form.watch('signerUuid')

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const createManagedSigner = async () => {
    setIsCreatingSigner(true)
    try {
      const response = await axios.post('/api/farcaster/managed-signer', {
        agentId,
      })

      const { signer_uuid, signer_approval_url, status } = response.data

      form.setValue('signerUuid', signer_uuid)
      setSignerApprovalUrl(signer_approval_url)
      setSignerStatus(status)

      // Start polling for approval
      startPolling(signer_uuid)
    } catch (error: unknown) {
      console.error('Failed to create managed signer:', error)
      const errorMessage = 'Failed to create managed signer'
      toast.error(errorMessage, {
        description: 'Please try again.',
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsCreatingSigner(false)
    }
  }

  const startPolling = (signerUuid: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          '/api/farcaster/managed-signer/status',
          {
            params: { signerUuid },
          },
        )

        const status = response.data?.status
        setSignerStatus(status)

        if (status === 'approved') {
          clearInterval(interval)
          setPollingInterval(null)
        }
      } catch (error) {
        console.error('Failed to check signer status:', error)
      }
    }, 3000) // Poll every 3 seconds

    setPollingInterval(interval)
  }

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
            {!isDeployed && (
              <FormField
                control={form.control}
                name="authMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Authentication Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="managed_signer" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Managed Signer (Recommended)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="mnemonic" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Mnemonic (Advanced)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      {authMethod === 'managed_signer'
                        ? 'Secure and easy - approve once in Warpcast, no mnemonic needed.'
                        : 'Direct access using your Farcaster mnemonic.'}
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}

            {authMethod === 'mnemonic' ? (
              <TokenField
                form={form}
                name="mnemonic"
                isDeployed={isDeployed ?? false}
                label="Mnemonic"
                description="Your Farcaster mnemonic."
                isSubmitting={form.formState.isSubmitting}
                placeholder="Enter mnemonic"
              />
            ) : (
              <div className="space-y-4">
                {!currentSignerUuid && !isDeployed ? (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      onClick={createManagedSigner}
                      disabled={isCreatingSigner}
                      className="w-full"
                    >
                      {isCreatingSigner
                        ? 'Creating Signer...'
                        : 'Create Managed Signer'}
                    </Button>
                  </div>
                ) : currentSignerUuid || hasExistingSignerUuid ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium mb-2">
                        Signer Status:{' '}
                        <span
                          className={
                            signerStatus === 'approved' || hasExistingSignerUuid
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          }
                        >
                          {hasExistingSignerUuid
                            ? 'Approved'
                            : signerStatus === 'approved'
                            ? 'Approved'
                            : 'Pending Approval'}
                        </span>
                      </p>
                      {hasExistingSignerUuid && (
                        <p className="text-xs text-muted-foreground">
                          Signer UUID: {hasExistingSignerUuid}
                        </p>
                      )}
                    </div>

                    {signerApprovalUrl &&
                      signerStatus !== 'approved' &&
                      !hasExistingSignerUuid && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            Scan this QR code or click the link to approve in
                            Warpcast:
                          </p>
                          <div className="flex justify-center p-4 bg-white rounded-lg">
                            <QRCodeSVG value={signerApprovalUrl} size={200} />
                          </div>
                          <a
                            href={signerApprovalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center text-sm text-blue-600 hover:underline"
                          >
                            Open in Warpcast
                          </a>
                        </div>
                      )}
                  </div>
                ) : null}
              </div>
            )}

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
              guideUrl="https://docs.eden.art/integrations/farcaster"
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
