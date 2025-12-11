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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { cn } from '@/lib/utils'
import { Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
  enableCast: z.boolean().default(false),
  instructions: z.string().optional(),
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
  const [localSignerUuid, setLocalSignerUuid] = useState<string>('')
  const [pollingInterval, setPollingInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const queryClient = useQueryClient()
  const deploymentsQueryKey = ['agents', agentId, 'deployments'] as const
  const refreshDeployments = async () => {
    try {
      const latest = await axios.get(`/api/agents/${agentId}/deployments`)
      queryClient.setQueryData(deploymentsQueryKey, latest.data)
    } catch (err) {
      console.error('Failed to refresh deployments cache', err)
    }
  }

  const hasExistingSignerUuid = deployment?.secrets?.farcaster?.signer_uuid

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      enableCast: deployment?.config?.farcaster?.enable_cast ?? false,
      instructions: deployment?.config?.farcaster?.instructions ?? '',
    },
  })

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  const showQRCode = localSignerUuid !== '' && !isDeployed

  const wasDeployed = useRef(isDeployed)
  useEffect(() => {
    if (wasDeployed.current && !isDeployed) {
      setIsOpen(false)
    }
    wasDeployed.current = isDeployed
  }, [isDeployed])

  // Reset form when deployment changes
  useEffect(() => {
    if (!isDeployed) {
      form.reset({
        enableCast: false,
        instructions: '',
      })
    } else {
      form.reset({
        enableCast: deployment?.config?.farcaster?.enable_cast ?? false,
        instructions: deployment?.config?.farcaster?.instructions ?? '',
      })
    }
  }, [
    isDeployed,
    deployment?.config?.farcaster?.enable_cast,
    deployment?.config?.farcaster?.instructions,
    form,
  ])

  // Start polling if deployment exists but signer not approved
  useEffect(() => {
    if (
      isDeployed &&
      hasExistingSignerUuid &&
      !pollingInterval &&
      signerStatus !== 'approved'
    ) {
      startPolling(hasExistingSignerUuid, false)
    }
  }, [isDeployed, hasExistingSignerUuid, pollingInterval, signerStatus])

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

      // Update local state immediately so QR code shows
      setLocalSignerUuid(signer_uuid)
      setSignerApprovalUrl(signer_approval_url)
      setSignerStatus(status)

      toast.success('Signer created! Please approve in Warpcast...', {
        richColors: true,
        dismissible: true,
      })

      // Start polling for approval - this is a NEW signer
      startPolling(signer_uuid, true)
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

  const startPolling = (signerUuid: string, isNewSigner: boolean = false) => {
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

          if (isNewSigner) {
            // Create deployment now that signer is approved
            try {
              const enableCastValue = form.getValues('enableCast')
              const instructionsValue = form.getValues('instructions')
              const deploymentPayload = {
                agentId,
                platform: 'farcaster',
                config: {
                  farcaster: {
                    enable_cast: enableCastValue,
                    instructions: instructionsValue,
                  },
                },
                secrets: {
                  farcaster: {
                    signer_uuid: signerUuid,
                  },
                },
              }

              await axios.post(
                `/api/agents/${agentId}/deployments`,
                deploymentPayload,
              )

              toast.success('Signer approved! Deployment created.', {
                richColors: true,
                dismissible: true,
              })

              // Clear local signer state
              setLocalSignerUuid('')
              setSignerApprovalUrl('')

              // Invalidate deployments query to refresh UI
              await queryClient.invalidateQueries({
                queryKey: deploymentsQueryKey,
                exact: true,
                refetchType: 'active',
              })
              await queryClient.refetchQueries({
                queryKey: deploymentsQueryKey,
                exact: true,
              })
              await refreshDeployments()
            } catch (error) {
              console.error('Failed to create deployment:', error)
              toast.error('Failed to create deployment', {
                description: 'Please try again.',
                richColors: true,
                dismissible: true,
              })
            }
          } else {
            // Existing deployment's signer was approved, just refresh
            queryClient.invalidateQueries({
              queryKey: deploymentsQueryKey,
              exact: true,
              refetchType: 'active',
            })
            await queryClient.refetchQueries({
              queryKey: deploymentsQueryKey,
              exact: true,
            })
            await refreshDeployments()
          }
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
          <form
            ref={formRef}
            className="flex flex-col w-full space-y-4 p-4"
            onSubmit={e => e.preventDefault()}
          >
            {!isDeployed && !showQRCode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={createManagedSigner}
                    disabled={isCreatingSigner}
                    className="w-full"
                  >
                    {isCreatingSigner
                      ? 'Creating Signer...'
                      : 'Create Farcaster Deployment'}
                  </Button>
                  <FormDescription className="text-center">
                    Creates a managed signer. You'll need to approve in
                    Farcaster.
                  </FormDescription>
                </div>
              </div>
            ) : null}

            {showQRCode && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    Signer Status:{' '}
                    <span className="text-yellow-600">Pending Approval</span>
                  </p>
                </div>

                {signerApprovalUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Scan this QR code or click the link to approve in
                      Farcaster:
                    </p>
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <QRCodeSVG value={signerApprovalUrl} size={200} />
                    </div>
                    <a
                      href={signerApprovalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-sm text-blue-600 hover:underline md:hidden"
                    >
                      Open in Warpcast
                    </a>
                  </div>
                )}
              </div>
            )}

            {isDeployed && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    Signer Status:{' '}
                    <span className="text-green-600">Approved</span>
                  </p>
                </div>
              </div>
            )}

            {isDeployed && (
              <>
                <FormField
                  control={form.control}
                  name="enableCast"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enable Casting
                        </FormLabel>
                        <FormDescription>
                          Enable your agent to cast on behalf of this Farcaster
                          account
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
                {form.watch('enableCast') && (
                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Casting Instructions
                        </FormLabel>
                        <FormDescription>
                          Control how your agent should interact with Farcaster
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter casting instructions..."
                            className="min-h-[100px] resize-y"
                            disabled={form.formState.isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                <DeploymentFormFooter
                  form={form}
                  agentId={agentId}
                  platform="farcaster"
                  isDeployed={isDeployed ?? false}
                  valid={deployment?.valid}
                  guideUrl="https://docs.eden.art/integrations/farcaster"
                />
              </>
            )}
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
