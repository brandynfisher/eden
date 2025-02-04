'use client'

import FormItemHead from '@/components/form/form-item-head'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { SwitchNoButton } from '@/components/ui/custom/switch-no-button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useAgentDeploymentFormSheet } from '@/stores/dialogs/dialogs.selector'
import { updateAgentDeploymentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { ChevronDownIcon, PlusIcon, RocketIcon, TrashIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { UseFormReturn, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const platformSchema = z
  .object({
    enabled: z.boolean(),
    token: z.string().optional(),
    allowedChannels: z.array(
      z.object({
        id: z.string().min(1, 'Channel ID is required'),
        note: z.string().optional(),
      }),
    ),
  })
  .refine(data => {
    if (!data.enabled) {
      return true
    }
  })

const deploymentSchema = z.object({
  discord: platformSchema,
  telegram: platformSchema,
  farcaster: platformSchema,
})

type DeploymentFormDto = z.infer<typeof deploymentSchema>

interface ErrorResponse {
  message: string
}

type ChannelFieldArray = ReturnType<typeof useFieldArray<DeploymentFormDto>>

type CollapsibleFieldProps = {
  form: UseFormReturn<DeploymentFormDto>
  channels: ReturnType<typeof useFieldArray<DeploymentFormDto>>
  renderChannelList: (
    platform: 'discord' | 'telegram' | 'farcaster',
    fieldArray: ChannelFieldArray,
  ) => React.ReactElement
  platform: 'discord' | 'telegram' | 'farcaster'
  label: string
  description: string
}

const CollapsibleField = ({
  form,
  channels,
  renderChannelList,
  platform,
  label,
  description,
}: CollapsibleFieldProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const platformWatch = form.watch(platform)

  useEffect(() => {
    setIsOpen(platformWatch.enabled)
  }, [platformWatch.enabled])

  const handleOpenChange = (newOpenState: boolean) => {
    if (newOpenState && platformWatch.enabled === false) {
      form.setValue(`${platform}.enabled`, true)
    }

    setIsOpen(newOpenState)
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="w-full"
    >
      <CollapsibleTrigger
        className={cn([
          'w-full border transition-colors rounded-lg',
          isOpen
            ? 'bg-muted-foreground/10 border border-gray-400/20 rounded-b-none'
            : 'border border-muted bg-popover',
          platformWatch.enabled
            ? 'bg-muted-foreground/5 border-gray-400/20'
            : '',
        ])}
      >
        <FormField
          control={form.control}
          name={`${platform}.enabled`}
          render={({ field, fieldState }) => (
            <FormItem
              className={cn([
                'flex flex-row items-center justify-between rounded-lg p-4',
              ])}
            >
              <FormItemHead
                icon={
                  <ChevronDownIcon
                    className={cn(
                      'w-4 h-4 mr-2 transition',
                      isOpen ? 'rotate-[-180deg]' : '',
                    )}
                  />
                }
                label={label}
                description={description}
              />
              <FormControl id={platform} className="ml-4">
                <SwitchNoButton
                  className="!mt-0 data-[state=unchecked]:!bg-gray-400 data-[state=unchecked]:dark:!bg-gray-700"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn([
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2 p-4'
            : '',
        ])}
      >
        <FormField
          control={form.control}
          name={`${platform}.token`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {platform === 'farcaster' ? 'API Token' : 'Bot Token'}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={`Enter your ${
                    platform === 'farcaster'
                      ? 'Farcaster API'
                      : `${platform} bot`
                  } token`}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Your{' '}
                {platform === 'farcaster' ? 'Farcaster API' : `${platform} bot`}{' '}
                token. This must be unique and can only be used by one agent.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {renderChannelList(platform, channels)}
      </CollapsibleContent>
    </Collapsible>
  )
}

const AgentDeploymentFormSheet = () => {
  const { isOpen, agent, onAction } = useAgentDeploymentFormSheet()
  const dispatch = useAppDispatch()

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(deploymentSchema),
    defaultValues: {
      discord: {
        enabled: false,
      },
      telegram: {
        enabled: false,
      },
      farcaster: {
        enabled: false,
      },
    },
  })

  const handleSubmit = async (data: DeploymentFormDto) => {
    try {
      await axios.post(`/api/agents/${agent?._id}/deployments`, data)
      toast.success('Deployments configured successfully', {
        description: 'Agent deployments have been configured',
        richColors: true,
        dismissible: true,
      })
      onAction?.()
    } catch (error) {
      toast.error(`Deployment configuration failed`, {
        description:
          (error as AxiosError<ErrorResponse>).response?.data?.message ||
          'Unknown Error has occurred',
        richColors: true,
        dismissible: true,
      })
    }
  }

  const onOpenChange = (open: boolean) => {
    dispatch(updateAgentDeploymentFormSheet({ isOpen: open }))
  }

  const discordChannels = useFieldArray({
    control: form.control,
    name: 'discord.allowedChannels',
    shouldUnregister: true,
  })

  const telegramChannels = useFieldArray({
    control: form.control,
    name: 'telegram.allowedChannels',
  })

  const farcasterChannels = useFieldArray({
    control: form.control,
    name: 'farcaster.allowedChannels',
    shouldUnregister: true,
  })

  const renderChannelList = (
    platform: 'discord' | 'telegram' | 'farcaster',
    fieldArray: ChannelFieldArray,
  ) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Allowed Channels</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fieldArray.append({ id: '', note: '' })}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Channel
        </Button>
      </div>
      {fieldArray.fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <FormField
            control={form.control}
            name={`${platform}.allowedChannels.${index}.id`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Channel ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${platform}.allowedChannels.${index}.note`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Note (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fieldArray.remove(index)}
            className="flex-shrink-0"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <RocketIcon size={18} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="overflow-y-auto w-full sm:!max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Configure Deployment</SheetTitle>
          <SheetDescription>
            Configure your agent's deployment settings across different
            platforms.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            className="w-full space-y-4 py-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="space-y-4 p-2 bg-muted/50 rounded-lg">
              <CollapsibleField
                form={form}
                channels={discordChannels}
                renderChannelList={renderChannelList}
                platform="discord"
                label="Discord"
                description="Deploy your agent to Discord servers"
              />
              <CollapsibleField
                form={form}
                channels={telegramChannels}
                renderChannelList={renderChannelList}
                platform="telegram"
                label="Telegram"
                description="Deploy your agent to Telegram groups"
              />
              <CollapsibleField
                form={form}
                channels={farcasterChannels}
                renderChannelList={renderChannelList}
                platform="farcaster"
                label="Farcaster"
                description="Deploy your agent to Farcaster channels"
              />
            </div>

            <SheetFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Configure Deployments
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default AgentDeploymentFormSheet
