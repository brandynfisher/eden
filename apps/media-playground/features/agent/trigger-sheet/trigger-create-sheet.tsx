import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { TriggerPlatformField } from '@/features/agent/trigger-sheet/trigger-platform-field'
import {
  TriggerRepeatOptions,
  triggerRepeatOptions,
} from '@/features/agent/trigger-sheet/trigger-repeat-options'
import { TriggerScheduleField } from '@/features/agent/trigger-sheet/trigger-schedule-field'
import { getChannelsForPlatform } from '@/features/agent/trigger-sheet/trigger-utils'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { CronSchedule } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const createTriggerSchema = z
  .object({
    instructions: z.string().min(1, 'Instructions are required'),
    platform: z.enum(['discord', 'twitter', 'telegram']),
    channelId: z.string().optional(),
    startDate: z.date(),
    repeat: z.nativeEnum(TriggerRepeatOptions),
    endDate: z.date().optional(),
    timezone: z.string(),
  })
  .refine(
    data => {
      if (data.platform !== 'twitter') {
        return data.channelId && data.channelId.length > 0
      }
      return true
    },
    {
      message: 'Channel is required',
      path: ['channelId'],
    },
  )

export type CreateTriggerDto = z.infer<typeof createTriggerSchema>

type TriggerCreateSheetProps = {
  agentId: string
}

export const TriggerCreateSheet = ({ agentId }: TriggerCreateSheetProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const { deployments } = useAgentDeploymentsQuery({
    key: agentId,
  })

  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const form = useForm<CreateTriggerDto>({
    resolver: zodResolver(createTriggerSchema),
    defaultValues: {
      instructions: '',
      platform: undefined,
      channelId: '',
      startDate: new Date(),
      repeat: TriggerRepeatOptions.DOES_NOT_REPEAT,
      timezone: defaultTimezone,
    },
  })

  const platform = form.watch('platform')

  const channels = useMemo(() => {
    if (!deployments) return []

    const deployment = deployments?.find(
      deployment => deployment.platform === platform,
    )

    if (!deployment) return []

    return getChannelsForPlatform(platform, deployment)
  }, [deployments, platform])

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        instructions: '',
        platform: undefined,
        channelId: '',
        startDate: new Date(),
        repeat: TriggerRepeatOptions.DOES_NOT_REPEAT,
        timezone: defaultTimezone,
      })
    }
  }, [isOpen])

  const onSubmit = async (values: CreateTriggerDto) => {
    try {
      const predefinedSchedule =
        triggerRepeatOptions.find(option => option.value === values.repeat)
          ?.schedule || {}

      const hour = values.startDate.getHours()
      const minute = values.startDate.getMinutes()

      const schedule: CronSchedule = {
        ...predefinedSchedule,
        hour,
        minute,
        timezone: values.timezone,
        start_date: values.startDate,
        end_date: values.endDate,
      }

      if (values.repeat === TriggerRepeatOptions.DOES_NOT_REPEAT) {
        schedule.end_date = undefined
      }

      const deployment = deployments?.find(
        deployment => deployment.platform === platform,
      )

      await axios.post(`/api/agents/${agentId}/triggers`, {
        message: values.instructions,
        schedule,
        deploymentId: deployment?._id,
        channelId: values.channelId,
      })

      toast.success('Task created successfully')
      setIsOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to create task')
    }
  }

  if (deployments?.length === 0) return null

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="w-fit self-end" variant="outline">
          Schedule Task
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-full sm:!max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Schedule New Task</SheetTitle>
          <SheetDescription>
            Schedule a new task for your agent.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel className="flex items-center">
                    Task Instructions*
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter instructions for the task"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TriggerPlatformField
              form={form}
              platform={platform}
              channels={channels}
            />

            <TriggerScheduleField form={form} />

            <SheetFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
