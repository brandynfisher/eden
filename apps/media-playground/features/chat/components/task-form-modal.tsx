'use client'

import DiscordIcon from '@/components/icons/discord'
import { TelegramIcon } from '@/components/icons/telegram'
import TwitterIcon from '@/components/icons/twitter'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getChannelsForPlatform } from '@/features/agent/trigger-sheet/trigger-utils'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAgentTriggersQuery } from '@/hooks/query/use-agent-triggers-query'
import { cn } from '@/lib/utils'
import { CronSchedule, Trigger } from '@edenlabs/eden-sdk'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { format } from 'date-fns'
import { CalendarIcon, GlobeIcon, Loader2 } from 'lucide-react'
import { FC, useMemo } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Extended repeat options for the simplified interface
export enum ExtendedTriggerRepeatOptions {
  DOES_NOT_REPEAT = 'DOES_NOT_REPEAT',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ANNUALLY = 'annually',
  CUSTOM = 'custom',
}

export const extendedTriggerRepeatOptions: {
  name: string
  value: ExtendedTriggerRepeatOptions
  schedule: unknown
}[] = [
  {
    name: "Doesn't repeat",
    value: ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT,
    schedule: {},
  },
  {
    name: 'Daily',
    value: ExtendedTriggerRepeatOptions.DAILY,
    schedule: { dayOfWeek: '*' },
  },
  {
    name: 'Weekly',
    value: ExtendedTriggerRepeatOptions.WEEKLY,
    schedule: { dayOfWeek: '1' }, // Monday
  },
  {
    name: 'Monthly',
    value: ExtendedTriggerRepeatOptions.MONTHLY,
    schedule: { dayOfMonth: '1' },
  },
  {
    name: 'Annually',
    value: ExtendedTriggerRepeatOptions.ANNUALLY,
    schedule: { month: '1', dayOfMonth: '1' },
  },
]

// Task schema for the simplified tasks interface
export const taskSchema = z
  .object({
    instructions: z.string().min(1, 'Instructions are required'),
    platform: z.enum(['web', 'discord', 'twitter', 'telegram']),
    channelId: z.string().optional(),
    startDate: z.date().optional(), // Only needed for "doesn't repeat"
    repeat: z.nativeEnum(ExtendedTriggerRepeatOptions),
    time: z.string().optional(), // HH:MM format
    dayOfWeek: z.string().optional(), // For weekly
    dayOfMonth: z.string().optional(), // For monthly/annually
    month: z.string().optional(), // For annually
    endDate: z.date().optional(),
  })
  .refine(
    data => {
      if (data.platform !== 'twitter' && data.platform !== 'web') {
        return data.channelId && data.channelId.length > 0
      }
      return true
    },
    {
      message: 'Channel is required',
      path: ['channelId'],
    },
  )

type TaskFormDto = z.infer<typeof taskSchema>

const TaskFormModal: FC<{
  agent: Agent
  editingTask?: Trigger | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}> = ({ agent, editingTask, open, onOpenChange, onSave }) => {
  const { invalidate } = useAgentTriggersQuery({
    key: agent._id,
    enabled: false,
  })

  const { deployments } = useAgentDeploymentsQuery({
    key: agent._id,
  })

  const form = useForm<TaskFormDto>({
    resolver: zodResolver(taskSchema),
    defaultValues: editingTask
      ? {
          instructions: editingTask.message,
          platform: editingTask.platform as TaskFormDto['platform'],
          channelId: editingTask.channel?.id || '',
          startDate: editingTask.schedule.start_date
            ? new Date(editingTask.schedule.start_date)
            : undefined,
          repeat: ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT, // Default for editing
          time: editingTask.schedule.start_date
            ? format(new Date(editingTask.schedule.start_date), 'HH:mm')
            : undefined,
          dayOfWeek: editingTask.schedule.day_of_week?.toString() || undefined,
          dayOfMonth: editingTask.schedule.dayOfMonth?.toString() || undefined,
          month: editingTask.schedule.month?.toString() || undefined,
        }
      : {
          instructions: '',
          platform: undefined,
          channelId: '',
          startDate: undefined,
          repeat: ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT,
          time: undefined,
          dayOfWeek: undefined,
          dayOfMonth: undefined,
          month: undefined,
        },
  })

  const platform = form.watch('platform')

  const channels = useMemo(() => {
    if (!deployments) return []
    const deployment = deployments?.find(d => d.platform === platform)
    if (!deployment) return []
    return getChannelsForPlatform(platform, deployment)
  }, [deployments, platform])

  const availablePlatforms = useMemo(() => {
    const deploymentPlatforms = deployments?.map(d => d.platform) || []
    // Always include 'web' platform
    return ['web', ...deploymentPlatforms.filter(p => p !== 'web')]
  }, [deployments])

  const onSubmit = async (values: TaskFormDto) => {
    try {
      // Auto-detect timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      // Convert form values to backend format
      let schedule: CronSchedule = {
        timezone,
      }

      // Handle different repeat options
      if (values.repeat === ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT) {
        // One-time task - use specific date and time
        if (values.startDate && values.time) {
          const [hour, minute] = values.time.split(':').map(Number)
          const startDate = new Date(values.startDate)
          startDate.setHours(hour, minute, 0, 0)

          schedule.start_date = startDate
          schedule.end_date = startDate
          schedule.hour = hour
          schedule.minute = minute
        }
      } else {
        // Recurring task - set time and schedule pattern
        if (values.time) {
          const [hour, minute] = values.time.split(':').map(Number)
          schedule.hour = hour
          schedule.minute = minute
        }

        // Add schedule pattern based on repeat type
        switch (values.repeat) {
          case ExtendedTriggerRepeatOptions.DAILY:
            schedule.day_of_week = '*'
            break
          case ExtendedTriggerRepeatOptions.WEEKLY:
            if (values.dayOfWeek) {
              schedule.day_of_week = values.dayOfWeek
            }
            break
          case ExtendedTriggerRepeatOptions.MONTHLY:
            if (values.dayOfMonth) {
              schedule.day_of_week = values.dayOfMonth
            }
            break
          case ExtendedTriggerRepeatOptions.ANNUALLY:
            if (values.month && values.dayOfMonth) {
              schedule.month = values.month
              schedule.dayOfMonth = values.dayOfMonth
            }
            break
        }

        // Set start date to now for recurring tasks
        schedule.start_date = new Date()

        // Set end date if provided
        if (values.endDate) {
          schedule.end_date = values.endDate
        }
      }

      const deployment = deployments?.find(d => d.platform === platform)

      if (editingTask) {
        // Update existing task
        await axios.patch(
          `/api/agents/${agent._id}/triggers/${editingTask._id}`,
          {
            message: values.instructions,
            schedule,
            platform: values.platform,
            deploymentId: deployment?._id,
            channelId: values.channelId,
          },
        )
        toast.success('Task updated successfully')
      } else {
        // Create new task
        await axios.post(`/api/agents/${agent._id}/triggers`, {
          message: values.instructions,
          schedule,
          platform: values.platform,
          deploymentId: deployment?._id,
          channelId: values.channelId,
        })
        toast.success('Task created successfully')
      }

      await invalidate()
      onSave()
      onOpenChange(false) // Only close modal on success
    } catch (error) {
      console.error(error)
      toast.error(
        editingTask ? 'Failed to update task' : 'Failed to create task',
      )
      // Don't close modal on error - let user retry
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6">
          <DialogTitle className="text-2xl font-semibold">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {editingTask
              ? 'Update the automated task settings below.'
              : 'Set up an automated task that will run on your chosen schedule.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Task Instructions */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Task Instructions
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="Describe what this task should do..."
                        className="resize-none min-h-[120px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Platform and Channel */}
            <div className="space-y-6">
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Platform
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Choose where to run this task" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePlatforms.map(platform => (
                              <SelectItem key={platform} value={platform}>
                                <div className="flex items-center gap-3 py-1">
                                  {platform === 'discord' && (
                                    <DiscordIcon size={18} />
                                  )}
                                  {platform === 'telegram' && (
                                    <TelegramIcon size={18} />
                                  )}
                                  {platform === 'twitter' && (
                                    <TwitterIcon size={18} />
                                  )}
                                  {platform === 'web' && (
                                    <GlobeIcon size={18} />
                                  )}
                                  <span className="capitalize font-medium">
                                    {platform}
                                  </span>
                                  {platform !== 'web' &&
                                    !deployments?.find(
                                      d => d.platform === platform,
                                    ) && (
                                      <span className="text-xs text-muted-foreground ml-2">
                                        (No deployments)
                                      </span>
                                    )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {platform && platform !== 'web' && platform !== 'twitter' && (
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="channelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Channel
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select a channel" />
                            </SelectTrigger>
                            <SelectContent>
                              {channels.map(channel => (
                                <SelectItem key={channel.id} value={channel.id}>
                                  <div className="py-1">
                                    {channel.note || channel.id}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <div className="space-y-6 border-t pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Choose when and how often this task should run
                </p>
              </div>

              <div className="space-y-4">
                {/* Repeat Selection */}
                <FormField
                  control={form.control}
                  name="repeat"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Choose schedule frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            {extendedTriggerRepeatOptions.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div className="py-1 font-medium">
                                  {option.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditional fields based on repeat selection */}
                {form.watch('repeat') ===
                  ExtendedTriggerRepeatOptions.WEEKLY && (
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select day of the week" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Sunday</SelectItem>
                              <SelectItem value="1">Monday</SelectItem>
                              <SelectItem value="2">Tuesday</SelectItem>
                              <SelectItem value="3">Wednesday</SelectItem>
                              <SelectItem value="4">Thursday</SelectItem>
                              <SelectItem value="5">Friday</SelectItem>
                              <SelectItem value="6">Saturday</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch('repeat') ===
                  ExtendedTriggerRepeatOptions.MONTHLY && (
                  <FormField
                    control={form.control}
                    name="dayOfMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select day of the month" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {Array.from({ length: 31 }, (_, i) => (
                                <SelectItem
                                  key={i + 1}
                                  value={(i + 1).toString()}
                                >
                                  <div className="py-1">
                                    {i + 1}
                                    {i + 1 === 1
                                      ? 'st'
                                      : i + 1 === 2
                                      ? 'nd'
                                      : i + 1 === 3
                                      ? 'rd'
                                      : 'th'}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch('repeat') ===
                  ExtendedTriggerRepeatOptions.ANNUALLY && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">January</SelectItem>
                                <SelectItem value="2">February</SelectItem>
                                <SelectItem value="3">March</SelectItem>
                                <SelectItem value="4">April</SelectItem>
                                <SelectItem value="5">May</SelectItem>
                                <SelectItem value="6">June</SelectItem>
                                <SelectItem value="7">July</SelectItem>
                                <SelectItem value="8">August</SelectItem>
                                <SelectItem value="9">September</SelectItem>
                                <SelectItem value="10">October</SelectItem>
                                <SelectItem value="11">November</SelectItem>
                                <SelectItem value="12">December</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Day" />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                {Array.from({ length: 31 }, (_, i) => (
                                  <SelectItem
                                    key={i + 1}
                                    value={(i + 1).toString()}
                                  >
                                    <div className="py-1">
                                      {i + 1}
                                      {i + 1 === 1
                                        ? 'st'
                                        : i + 1 === 2
                                        ? 'nd'
                                        : i + 1 === 3
                                        ? 'rd'
                                        : 'th'}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Time picker for all except "doesn't repeat" */}
                {form.watch('repeat') !==
                  ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT && (
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Choose time to run" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {Array.from({ length: 96 }, (_, i) => {
                                const hour = Math.floor(i / 4)
                                const minute = (i % 4) * 15
                                const time24 = `${hour
                                  .toString()
                                  .padStart(2, '0')}:${minute
                                  .toString()
                                  .padStart(2, '0')}`
                                const hour12 =
                                  hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                                const ampm = hour < 12 ? 'AM' : 'PM'
                                const time12 = `${hour12}:${minute
                                  .toString()
                                  .padStart(2, '0')} ${ampm}`

                                return (
                                  <SelectItem key={time24} value={time24}>
                                    <div className="py-1 font-medium">
                                      {time12}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Start date/time for "doesn't repeat" */}
                {form.watch('repeat') ===
                  ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-full h-12 justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground',
                                  )}
                                >
                                  <CalendarIcon className="mr-3 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, 'MMMM d, yyyy')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={date =>
                                  date <
                                  new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Choose time" />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                {Array.from({ length: 96 }, (_, i) => {
                                  const hour = Math.floor(i / 4)
                                  const minute = (i % 4) * 15
                                  const time24 = `${hour
                                    .toString()
                                    .padStart(2, '0')}:${minute
                                    .toString()
                                    .padStart(2, '0')}`
                                  const hour12 =
                                    hour === 0
                                      ? 12
                                      : hour > 12
                                      ? hour - 12
                                      : hour
                                  const ampm = hour < 12 ? 'AM' : 'PM'
                                  const time12 = `${hour12}:${minute
                                    .toString()
                                    .padStart(2, '0')} ${ampm}`

                                  return (
                                    <SelectItem key={time24} value={time24}>
                                      <div className="py-1 font-medium">
                                        {time12}
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="px-6 min-w-[140px]"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingTask ? 'Updating...' : 'Creating...'}
                  </>
                ) : editingTask ? (
                  'Update Task'
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default TaskFormModal
