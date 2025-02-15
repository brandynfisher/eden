'use client'

import { getQueryClient } from '@/app/get-query-client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AgentClientType, AgentsDeployArguments } from '@edenlabs/eden-sdk'
import { StopIcon } from '@radix-ui/react-icons'
import axios from 'axios'
import { RocketIcon, SaveIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'

interface DeploymentFormFooterProps {
  form: UseFormReturn<any>
  agentId: string
  isDeployed: boolean
  platform: string
}

export const DeploymentFormFooter = ({
  form,
  agentId,
  platform,
  isDeployed,
}: DeploymentFormFooterProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)

  const handleDelete = async () => {
    const queryClient = getQueryClient()
    setIsDeleting(true)
    try {
      await axios.delete(`/api/agents/${agentId}/deployments`, {
        data: { platform },
      })
      toast.success('Deployment deleted successfully', {
        description: `The ${platform} deployment has been deleted successfully.`,
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      toast.error('Failed to delete deployment', {
        description: `The ${platform} deployment could not be deleted. Please try again.`,
        richColors: true,
        dismissible: true,
      })
    } finally {
      queryClient.invalidateQueries({
        queryKey: ['agents', agentId, 'deployments'],
      })
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (data: any) => {
    setIsDeploying(true)
    const queryClient = getQueryClient()
    const loadingMessage = isDeployed
      ? `Updating ${platform} deployment`
      : `Deploying agent to ${platform}`

    const successMessage = isDeployed
      ? `Deployment updated successfully`
      : `Deployed to ${platform} successfully`

    const errorMessage = isDeployed
      ? `Failed to update ${platform} deployment`
      : `Failed to deploy agent to ${platform}`

    const toastId = toast.loading(loadingMessage)

    try {
      let config = {}
      if (platform === 'discord') {
        config = {
          discord: {
            channel_allowlist: data.allowedChannels,
          },
        }
      } else if (platform === 'telegram') {
        config = {
          telegram: {
            topic_allowlist: data.allowedTopics,
          },
        }
      }

      if (isDeployed) {
        await axios.patch(`/api/agents/${agentId}/deployments`, {
          agentId,
          platform,
          config,
        })
      } else {
        const payload: AgentsDeployArguments = {
          agentId,
          platform: platform as AgentClientType,
          config,
        }

        if (platform === 'discord') {
          payload.secrets = {
            discord: {
              token: data.token,
            },
          }
        } else if (platform === 'telegram') {
          payload.secrets = {
            telegram: {
              token: data.token,
            },
          }
        } else if (platform === 'farcaster') {
          payload.secrets = {
            farcaster: {
              mnemonic: data.mnemonic,
              neynarWebhookSecret: data.neynarWebhookSecret,
            },
          }
        }

        await axios.post(`/api/agents/${agentId}/deployments`, payload)
      }

      toast.success(successMessage, {
        id: toastId,
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      console.error(error)
      toast.error(errorMessage, {
        id: toastId,
        richColors: true,
        dismissible: true,
      })
    } finally {
      queryClient.invalidateQueries({
        queryKey: ['agents', agentId, 'deployments'],
      })
      setIsDeploying(false)
    }
  }

  const handleStop = async () => {
    const queryClient = getQueryClient()
    try {
      await axios.post(`/api/agents/${agentId}/deployments/stop`, {
        platform,
      })
      toast.success('Deployment stopped successfully', {
        description: `The ${platform} deployment has been stopped successfully.`,
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to stop deployment', {
        description: `The ${platform} deployment could not be stopped. Please try again.`,
        richColors: true,
        dismissible: true,
      })
    } finally {
      queryClient.invalidateQueries({
        queryKey: ['agents', agentId, 'deployments'],
      })
    }
  }

  return (
    <>
      <Separator className="my-4" />
      <div className="flex items-center gap-2 self-end">
        {isDeployed && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={form.formState.isSubmitting || isDeleting}
          >
            <TrashIcon className="size-4 mr-2" />
            Delete
          </Button>
        )}
        {isDeploying ? (
          <Button type="button" onClick={handleStop}>
            <StopIcon className="size-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isDeploying || !form.formState.isDirty}
          >
            {isDeployed ? (
              <SaveIcon className="size-4 mr-2" />
            ) : (
              <RocketIcon className="size-4 mr-2" />
            )}
            {isDeployed ? 'Update' : 'Deploy'}
          </Button>
        )}
      </div>
    </>
  )
}
