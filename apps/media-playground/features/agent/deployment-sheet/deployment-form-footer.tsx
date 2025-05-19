'use client'

import { getQueryClient } from '@/app/get-query-client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AgentClientType, AgentsDeployArguments } from '@edenlabs/eden-sdk'
import { StopIcon } from '@radix-ui/react-icons'
import axios from 'axios'
import { BookTextIcon, RocketIcon, SaveIcon, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'

interface DeploymentFormFooterProps {
  form: UseFormReturn<any>
  agentId: string
  isDeployed: boolean
  platform: string
  guideUrl?: string
  valid?: boolean
}

export const DeploymentFormFooter = ({
  form,
  agentId,
  platform,
  isDeployed,
  guideUrl,
  valid,
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
    } catch {
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
            read_access_channels: data.readAccessChannels,
          },
        }
      } else if (platform === 'telegram') {
        config = {
          telegram: {
            topic_allowlist: data.allowedTopics,
          },
        }
      } else if (platform === 'twitter') {
        config = {
          twitter: {
            username: data.username,
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
        } else if (platform === 'twitter') {
          payload.secrets = {
            twitter: {
              user_id: data.userId,
              bearer_token: data.bearerToken,
              consumer_key: data.consumerKey,
              consumer_secret: data.consumerSecret,
              access_token: data.accessToken,
              access_token_secret: data.accessTokenSecret,
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
      <div className="flex justify-between gap-2">
        {guideUrl && (
          <Button variant="outline" asChild>
            <Link href={guideUrl} target="_blank">
              <BookTextIcon className="size-4 mr-2" />
              Guide
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-2 ml-auto self-end">
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
            valid !== false && (
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
            )
          )}
        </div>
      </div>
      {valid === false && (
        <div className="mt-2 text-sm text-destructive">
          <p>
            The deployment has failed. Please delete and try deploying again.
          </p>
        </div>
      )}
    </>
  )
}
