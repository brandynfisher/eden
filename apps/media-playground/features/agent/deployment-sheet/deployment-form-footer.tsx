'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AgentClientType, AgentsDeployArguments } from '@edenlabs/eden-sdk'
import { StopIcon } from '@radix-ui/react-icons'
import { useQueryClient } from '@tanstack/react-query'
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
  canSubmit?: boolean
}

export const DeploymentFormFooter = ({
  form,
  agentId,
  platform,
  isDeployed,
  guideUrl,
  valid,
  canSubmit = true,
}: DeploymentFormFooterProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
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

  const handleDelete = async () => {
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
    } catch (error: any) {
      const apiErrorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message
      const actualErrorMessage = apiErrorMessage
        ? `Failed to delete deployment - ${apiErrorMessage}`
        : 'Failed to delete deployment'
      toast.error(actualErrorMessage, {
        description: `The ${platform} deployment could not be deleted. Please try again.`,
        richColors: true,
        dismissible: true,
      })
    } finally {
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
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (data: any) => {
    setIsDeploying(true)
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
        // Split unified channels into allowed and read-only lists
        const allowedChannels = (data.channels || [])
          .filter((ch: { readOnly?: boolean }) => !ch.readOnly)
          .map((ch: { id: string; note?: string }) => ({
            id: ch.id,
            note: ch.note,
          }))
        const readAccessChannels = (data.channels || [])
          .filter((ch: { readOnly?: boolean }) => ch.readOnly)
          .map((ch: { id: string; note?: string }) => ({
            id: ch.id,
            note: ch.note,
          }))

        config = {
          discord: {
            channel_allowlist: allowedChannels,
            read_access_channels: readAccessChannels,
            enable_discord_dm: data.enableDiscordDm ?? false,
          },
        }
      } else if (platform === 'discord_v3') {
        config = {
          discord: {
            guild_id: data.guildId,
            channel_configs: (data.channels || []).map((ch: any) => ({
              channel_id: ch.channelId,
              channel_name: ch.channelName,
              access: ch.access || 'read_write',
            })),
          },
        }
      } else if (platform === 'telegram') {
        config = {
          telegram: {
            topic_allowlist: data.allowedTopics,
          },
        }
      } else if (platform === 'farcaster') {
        config = {
          farcaster: {
            enable_cast: data.enableCast,
            instructions: data.instructions,
          },
        }
      } else if (platform === 'twitter') {
        config = {
          twitter: {
            username: data.username,
            enable_tweet: data.enableTweet,
            instructions: data.instructions,
          },
        }
      } else if (platform === 'shopify') {
        config = {
          shopify: {},
        }
      } else if (platform === 'email') {
        const domain = data.domain
        if (!domain || domain.status !== 'verified') {
          throw new Error('Email domain must be verified before deployment')
        }
        if (!data.senderEmail || data.senderEmail.trim().length === 0) {
          throw new Error('Sender email is required')
        }

        config = {
          email: {
            domain_id: domain.id ?? domain._id,
            sender_email: data.senderEmail.trim(),
            autoreply_enabled: data.autoreply,
            reply_delay_average_minutes: Number(data.replyDelayAverage ?? 0),
            reply_delay_variance_minutes: Number(data.replyDelayVariance ?? 0),
          },
        }
      } else if (platform === 'gmail') {
        config = {
          gmail: {
            reply_delay_minimum: Number(data.replyDelayMinimum ?? 0),
            reply_delay_variance: Number(data.replyDelayVariance ?? 0),
            email_instructions:
              data.emailInstructions?.trim().length > 0
                ? data.emailInstructions.trim()
                : undefined,
          },
        }
      } else if (platform === 'google_calendar') {
        config = {
          google_calendar: {
            calendar_id: data.calendarId,
            calendar_name: data.calendarName,
            allow_write: data.allowWrite ?? false,
            allow_delete: data.allowDelete ?? false,
            time_zone: data.timeZone,
            google_email: data.credentials?.google_email,
          },
        }
      }

      if (isDeployed) {
        const payload: any = {
          agentId,
          platform,
          config,
        }

        // Add secrets for updates if provided
        if (platform === 'discord' && data.token) {
          payload.secrets = {
            discord: {
              token: data.token,
            },
          }
        } else if (platform === 'discord_v3') {
          payload.secrets = {
            discord: {},
          }
        } else if (platform === 'telegram' && data.token) {
          payload.secrets = {
            telegram: {
              token: data.token,
            },
          }
        } else if (platform === 'farcaster' && data.mnemonic) {
          payload.secrets = {
            farcaster: {
              mnemonic: data.mnemonic,
            },
          }
        } else if (platform === 'twitter' && data.bearerToken) {
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
        } else if (platform === 'shopify' && data.accessToken) {
          payload.secrets = {
            shopify: {
              store_name: data.storeName,
              access_token: data.accessToken,
              location_id: data.locationId,
            },
          }
        } else if (platform === 'printify' && data.api_token) {
          payload.secrets = {
            printify: {
              api_token: data.api_token,
              shop_id: data.shop_id,
            },
          }
        } else if (platform === 'captions' && data.api_key) {
          payload.secrets = {
            captions: {
              api_key: data.api_key,
            },
          }
        } else if (platform === 'email' && data.domain) {
          payload.secrets = {
            email: {
              domain: data.domain.domain,
              provider_domain_id: data.domain.provider_domain_id,
              inbound_route_id: data.domain.inbound_route_id,
              inbound_route_expression: data.domain.inbound_route_expression,
              forwarding_address: data.domain.forwarding_address,
              webhook_signing_key: data.domain.webhook_signing_key,
            },
          }
        } else if (platform === 'google_calendar' && data.credentials) {
          payload.secrets = {
            google_calendar: {
              access_token: data.credentials.access_token,
              refresh_token: data.credentials.refresh_token,
              token_uri: data.credentials.token_uri,
              client_id: data.credentials.client_id,
              client_secret: data.credentials.client_secret,
              scopes: data.credentials.scopes,
              expires_at: data.credentials.expires_at,
              google_user_id: data.credentials.google_user_id,
              google_email: data.credentials.google_email,
            },
          }
        }

        await axios.patch(`/api/agents/${agentId}/deployments`, payload)
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
        } else if (platform === 'discord_v3') {
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
        } else if (platform === 'farcaster' && data.mnemonic) {
          payload.secrets = {
            farcaster: {
              mnemonic: data.mnemonic,
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
        } else if (platform === 'shopify') {
          payload.secrets = {
            shopify: {
              store_name: data.storeName,
              access_token: data.accessToken,
              location_id: data.locationId,
            },
          }
        } else if (platform === 'printify') {
          payload.secrets = {
            printify: {
              api_token: data.api_token,
              shop_id: data.shop_id,
            },
          }
        } else if (platform === 'captions') {
          payload.secrets = {
            captions: {
              api_key: data.api_key,
            },
          }
        } else if (platform === 'email' && data.domain) {
          payload.secrets = {
            email: {
              domain: data.domain.domain,
              provider_domain_id: data.domain.provider_domain_id,
              inbound_route_id: data.domain.inbound_route_id,
              inbound_route_expression: data.domain.inbound_route_expression,
              forwarding_address: data.domain.forwarding_address,
              webhook_signing_key: data.domain.webhook_signing_key,
            },
          }
        } else if (platform === 'google_calendar' && data.credentials) {
          payload.secrets = {
            google_calendar: {
              access_token: data.credentials.access_token,
              refresh_token: data.credentials.refresh_token,
              token_uri: data.credentials.token_uri,
              client_id: data.credentials.client_id,
              client_secret: data.credentials.client_secret,
              scopes: data.credentials.scopes,
              expires_at: data.credentials.expires_at,
              google_user_id: data.credentials.google_user_id,
              google_email: data.credentials.google_email,
            },
          }
        }

        await axios.post(`/api/agents/${agentId}/deployments`, payload)

        // Auto-enable social media tools when a new integration is deployed
        try {
          // First get current agent to preserve existing tools
          const agentResponse = await axios.get(`/api/agents/${agentId}`)
          const currentTools = agentResponse.data?.agent?.tools || {}

          // Only update if social_media_tools is not already enabled
          if (!currentTools.social_media_tools) {
            await axios.patch(`/api/agents/${agentId}`, {
              tools: {
                ...currentTools,
                social_media_tools: true,
              },
            })
            // Invalidate agent query cache so Tools tab reflects the change
            await queryClient.invalidateQueries({
              queryKey: ['agents', agentId],
            })
          }
        } catch (toolsError) {
          // Don't fail the deployment if tools update fails, just log it
          console.error('Failed to auto-enable social media tools:', toolsError)
        }
      }

      toast.success(successMessage, {
        id: toastId,
        richColors: true,
        dismissible: true,
      })
    } catch (error: any) {
      console.error(error)
      const apiErrorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message
      const prefix = isDeployed
        ? 'Failed to update deployment'
        : 'Failed to deploy agent'
      const actualErrorMessage = apiErrorMessage
        ? `${prefix} - ${apiErrorMessage}`
        : errorMessage
      toast.error(actualErrorMessage, {
        id: toastId,
        richColors: true,
        dismissible: true,
      })
    } finally {
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
      setIsDeploying(false)
    }
  }

  const handleStop = async () => {
    try {
      await axios.post(`/api/agents/${agentId}/deployments/stop`, {
        platform,
      })
      toast.success('Deployment stopped successfully', {
        description: `The ${platform} deployment has been stopped successfully.`,
        richColors: true,
        dismissible: true,
      })
    } catch (error: any) {
      console.error(error)
      const apiErrorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message
      const actualErrorMessage = apiErrorMessage
        ? `Failed to stop deployment - ${apiErrorMessage}`
        : 'Failed to stop deployment'
      toast.error(actualErrorMessage, {
        description: `The ${platform} deployment could not be stopped. Please try again.`,
        richColors: true,
        dismissible: true,
      })
    } finally {
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
                onClick={form.handleSubmit(handleSubmit, errors => {
                  console.error('Form validation errors:', errors)
                  const firstError = Object.values(errors)[0]
                  if (firstError?.message) {
                    toast.error(`Validation error: ${firstError.message}`, {
                      richColors: true,
                      dismissible: true,
                    })
                  }
                })}
                disabled={isDeploying || !form.formState.isDirty || !canSubmit}
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
