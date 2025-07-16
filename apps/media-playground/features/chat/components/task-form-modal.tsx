'use client'

import DiscordIcon from '@/components/icons/discord'
import { FarcasterIcon } from '@/components/icons/farcaster'
import { TelegramIcon } from '@/components/icons/telegram'
import TwitterIcon from '@/components/icons/twitter'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Dialog,
  DialogContent,
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
import { Input } from '@/components/ui/input'
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
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAgentTriggersQuery } from '@/hooks/query/use-agent-triggers-query'
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { cn } from '@/lib/utils'
import { CronSchedule, Trigger } from '@edenlabs/eden-sdk'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { format, addMinutes } from 'date-fns'
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { FC } from 'react'
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
    // Session targeting (moved from posting instructions)
    sessionType: z.enum(['new', 'another']).default('new'),
    sessionId: z.string().optional(),
    startDate: z.date().optional(), // Only needed for "doesn't repeat"
    repeat: z.nativeEnum(ExtendedTriggerRepeatOptions),
    time: z.string().optional(), // HH:MM format
    dayOfWeek: z.string().optional(), // For weekly
    dayOfMonth: z.string().optional(), // For monthly/annually
    month: z.string().optional(), // For annually
    endDate: z.date().optional(),
    timezone: z.string(),
    // Posting instructions
    enablePosting: z.boolean().default(false),
    postTo: z
      .enum(['same', 'another', 'discord', 'telegram', 'x', 'farcaster'])
      .default('same'),
    postToSessionId: z.string().optional(), // Different from sessionId above
    channelId: z.string().optional(),
    customInstructions: z.string().optional(),
  })
  .refine(data => {
    // If sessionType is "another", sessionId must be provided
    if (data.sessionType === 'another' && !data.sessionId) {
      return false
    }
    // If enablePosting and postTo is "another", postToSessionId must be provided
    if (
      data.enablePosting &&
      data.postTo === 'another' &&
      !data.postToSessionId
    ) {
      return false
    }
    return true
  })
  .superRefine((data, ctx) => {
    // Custom validation for each field
    if (data.sessionType === 'another' && !data.sessionId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please select a session when targeting another session',
        path: ['sessionId'],
      })
    }
    if (
      data.enablePosting &&
      data.postTo === 'another' &&
      !data.postToSessionId
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please select a session to post to',
        path: ['postToSessionId'],
      })
    }
    
    // Validate that tasks are scheduled at least 3 minutes in the future
    if (data.repeat === ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT && data.startDate && data.time) {
      const [hour, minute] = data.time.split(':').map(Number)
      const scheduledDateTime = new Date(data.startDate)
      scheduledDateTime.setHours(hour, minute, 0, 0)
      
      const minimumTime = addMinutes(new Date(), 3)
      
      if (scheduledDateTime < minimumTime) {
        ctx.addIssue({
          code: 'custom',
          message: 'Tasks must be scheduled at least 3 minutes in the future',
          path: ['startDate'],
        })
        ctx.addIssue({
          code: 'custom',
          message: 'Tasks must be scheduled at least 3 minutes in the future',
          path: ['time'],
        })
      }
    }
  })

type TaskFormDto = z.infer<typeof taskSchema>

const TaskFormModal: FC<{
  agent: Agent
  editingTask?: Trigger | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}> = ({ agent, editingTask, open, onOpenChange, onSave }) => {
  // Fetch deployments separately since agent.deployments is empty
  const deploymentsQuery = useAgentDeploymentsQuery({
    key: agent._id,
    enabled: open, // Only fetch when modal is open
  })

  // Get available social platforms based on agent deployments
  const availablePlatforms = React.useMemo(() => {
    const platforms: string[] = []

    // Use deployments from the query since agent.deployments is empty
    const deployments = deploymentsQuery.deployments || []

    deployments.forEach(deployment => {
      if (deployment.platform === 'discord') platforms.push('discord')
      if (deployment.platform === 'telegram') platforms.push('telegram')
      if (deployment.platform === 'twitter') platforms.push('x')
      if (deployment.platform === 'farcaster') platforms.push('farcaster')
    })
    return platforms
  }, [deploymentsQuery.deployments, deploymentsQuery.isLoading, open])

  // Get channel options for Discord and Telegram
  const getChannelOptions = React.useMemo(() => {
    const discordChannels = []
    const telegramChannels = []

    // Get from deployments query
    const deployments = deploymentsQuery.deployments || []
    deployments.forEach(deployment => {
      if (
        deployment.platform === 'discord' &&
        deployment.config?.discord?.channel_allowlist
      ) {
        discordChannels.push(...deployment.config.discord.channel_allowlist)
      }
      if (
        deployment.platform === 'telegram' &&
        deployment.config?.telegram?.topic_allowlist
      ) {
        telegramChannels.push(...deployment.config.telegram.topic_allowlist)
      }
    })

    // Fallback to agent's direct allowlists
    if (discordChannels.length === 0 && agent.discordChannelAllowlist) {
      discordChannels.push(...agent.discordChannelAllowlist)
    }
    if (telegramChannels.length === 0 && agent.telegramTopicAllowlist) {
      telegramChannels.push(...agent.telegramTopicAllowlist)
    }

    return { discordChannels, telegramChannels }
  }, [
    deploymentsQuery.deployments,
    agent.discordChannelAllowlist,
    agent.telegramTopicAllowlist,
  ])
  const { invalidate } = useAgentTriggersQuery({
    key: agent._id,
    enabled: false,
  })

  const { sessions, isLoading: isLoadingSessions } = useSessionListQuery({
    enabled: open, // Only fetch when modal is open
  })

  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const currentTime = format(new Date(), 'HH:mm')

  // Create a simplified schema for editing (only instruction validation)
  const editingTaskSchema = z.object({
    instructions: z.string().min(1, 'Instructions are required'),
    // Other fields are optional/ignored when editing
    sessionType: z.enum(['new', 'another']).optional(),
    sessionId: z.string().optional(),
    startDate: z.date().optional(),
    repeat: z.nativeEnum(ExtendedTriggerRepeatOptions).optional(),
    time: z.string().optional(),
    dayOfWeek: z.string().optional(),
    dayOfMonth: z.string().optional(),
    month: z.string().optional(),
    endDate: z.date().optional(),
    timezone: z.string().optional(),
    enablePosting: z.boolean().optional(),
    postTo: z
      .enum(['same', 'another', 'discord', 'telegram', 'x', 'farcaster'])
      .optional(),
    postToSessionId: z.string().optional(),
    channelId: z.string().optional(),
    customInstructions: z.string().optional(),
  })

  const form = useForm<TaskFormDto>({
    resolver: zodResolver(editingTask ? editingTaskSchema : taskSchema),
    defaultValues: {
      instructions: '',
      sessionType: 'new',
      sessionId: undefined,
      startDate: addMinutes(new Date(), 3),
      repeat: ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT,
      time: format(addMinutes(new Date(), 3), 'HH:mm'),
      dayOfWeek: undefined,
      dayOfMonth: undefined,
      month: undefined,
      timezone: defaultTimezone,
      // Posting instructions
      enablePosting: false,
      postTo: 'same',
      postToSessionId: undefined,
      channelId: undefined,
      customInstructions:
        "Summarize everything you just did in markdown. Include only the requested media, don't include any intermediary results which the user didn't ask for",
    },
  })

  const [showSessionSelect, setShowSessionSelect] = React.useState(false)

  // Reset form when editingTask changes
  React.useEffect(() => {
    if (editingTask) {
      // Reset form with the editing task data
      const formData = {
        instructions: editingTask.instruction,
        sessionType: (editingTask.session_type as 'new' | 'another') || 'new',
        sessionId: editingTask.session || undefined,
        startDate: editingTask.schedule.start_date
          ? new Date(editingTask.schedule.start_date)
          : undefined,
        repeat: ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT, // Default for editing
        time: editingTask.schedule.start_date
          ? format(new Date(editingTask.schedule.start_date), 'HH:mm')
          : currentTime,
        dayOfWeek: editingTask.schedule.day_of_week?.toString() || undefined,
        dayOfMonth: editingTask.schedule.day?.toString() || undefined,
        month: editingTask.schedule.month?.toString() || undefined,
        timezone: editingTask.schedule.timezone || defaultTimezone,
        // Posting instructions
        enablePosting: !!editingTask.posting_instructions,
        postTo:
          (editingTask.posting_instructions?.post_to as
            | 'same'
            | 'another'
            | 'discord'
            | 'telegram'
            | 'x'
            | 'farcaster') || 'same',
        postToSessionId:
          editingTask.posting_instructions?.session_id || undefined,
        channelId: editingTask.posting_instructions?.channel_id || undefined,
        customInstructions:
          editingTask.posting_instructions?.custom_instructions ||
          "Summarize everything you just did in markdown. Include only the requested media, don't include any intermediary results which the user didn't ask for",
      }

      form.reset(formData)
    }
  }, [editingTask, form, currentTime, defaultTimezone])

  // Reset form when modal is closed
  React.useEffect(() => {
    if (!open) {
      const minimumDateTime = addMinutes(new Date(), 3)
      form.reset({
        instructions: '',
        sessionType: 'new',
        sessionId: undefined,
        startDate: minimumDateTime,
        repeat: ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT,
        time: format(minimumDateTime, 'HH:mm'),
        dayOfWeek: undefined,
        dayOfMonth: undefined,
        month: undefined,
        timezone: defaultTimezone,
        postTo: 'same',
        postToSessionId: undefined,
        channelId: undefined,
        customInstructions:
          "Summarize everything you just did in markdown. Include only the requested media, don't include any intermediary results which the user didn't ask for",
        enablePosting: false,
      })
    }
  }, [open, form, defaultTimezone])

  const onSubmit = async (values: TaskFormDto) => {
    try {
      // Convert form values to backend format
      let schedule: CronSchedule = {
        timezone: values.timezone,
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
              schedule.day = values.dayOfMonth
            }
            break
          case ExtendedTriggerRepeatOptions.ANNUALLY:
            if (values.month && values.dayOfMonth) {
              schedule.month = values.month
              schedule.day = values.dayOfMonth
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

      // Build posting instructions only if posting is enabled
      let posting_instructions = null
      if (values.enablePosting) {
        posting_instructions = {
          post_to: values.postTo,
          session_id: null as string | null,
          channel_id: null as string | null,
          custom_instructions: undefined as string | undefined,
        }

        // Only add session_id if posting to another session
        if (values.postTo === 'another' && values.postToSessionId) {
          posting_instructions.session_id = values.postToSessionId
        }

        if (
          (values.postTo === 'discord' || values.postTo === 'telegram') &&
          values.channelId
        ) {
          posting_instructions.channel_id = values.channelId
        }

        if (values.customInstructions) {
          posting_instructions.custom_instructions = values.customInstructions
        }
      }

      if (editingTask) {
        // Update existing task - only allow instruction changes
        await axios.patch(
          `/api/agents/${agent._id}/triggers/${editingTask._id}`,
          {
            instruction: values.instructions,
          },
        )
        toast.success('Task updated successfully')
      } else {
        // Create new task
        const requestData = {
          instruction: values.instructions,
          session_type: values.sessionType,
          session: values.sessionType === 'another' ? values.sessionId : null,
          schedule,
          posting_instructions,
        }
        await axios.post(`/api/agents/${agent._id}/triggers`, requestData)
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
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, () => {
              toast.error('Unknown error')
            })}
            className="space-y-8"
          >
            {/* Task Instructions */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">
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

              {/* Session Targeting - only show when creating new task */}
              {!editingTask && (
                <>
                  <FormField
                    control={form.control}
                    name="sessionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Session
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Choose session target" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              <SelectItem value="new">
                                Create new Session
                              </SelectItem>
                              <SelectItem value="another">
                                Target another Session
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Session Dropdown - only shown if "Target another Session" is selected */}
                  {form.watch('sessionType') === 'another' && (
                    <FormField
                      control={form.control}
                      name="sessionId"
                      render={({ field }) => (
                        <FormItem>
                          <Popover
                            open={showSessionSelect}
                            onOpenChange={setShowSessionSelect}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="h-12 w-full justify-between font-normal"
                                >
                                  {field.value
                                    ? sessions
                                        .filter(
                                          (
                                            session,
                                          ): session is NonNullable<
                                            typeof session
                                          > => Boolean(session),
                                        )
                                        .find(
                                          session =>
                                            session._id === field.value,
                                        )?.title ||
                                      `Session ${field.value.slice(-6)}`
                                    : 'Select target session'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                <CommandInput placeholder="Search sessions..." />
                                <CommandEmpty>
                                  {isLoadingSessions
                                    ? 'Loading sessions...'
                                    : 'No sessions found.'}
                                </CommandEmpty>
                                <CommandGroup className="overflow-auto max-h-72">
                                  {!isLoadingSessions &&
                                    sessions
                                      .filter(
                                        (
                                          session,
                                        ): session is NonNullable<
                                          typeof session
                                        > => Boolean(session),
                                      )
                                      .map(session => (
                                        <CommandItem
                                          key={session._id}
                                          value={session._id}
                                          onSelect={() => {
                                            field.onChange(session._id)
                                            setShowSessionSelect(false)
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              'mr-2 h-4 w-4',
                                              field.value === session._id
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                            )}
                                          />
                                          {session.title ||
                                            `Session ${session._id.slice(-6)}`}
                                        </CommandItem>
                                      ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
            </div>

            {/* Posting Instructions Section - only show when creating new task */}
            {!editingTask && (
              <div className="space-y-6 border-t pt-6">
                <div className="space-y-4">
                  {/* Toggle for posting summary */}
                  <FormField
                    control={form.control}
                    name="enablePosting"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-lg font-semibold cursor-pointer">
                            Post a summary of the results
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Conditional posting options - only shown if enablePosting is true */}
                  {form.watch('enablePosting') && (
                    <div className="space-y-4 ml-6 border-l-2 border-muted pl-4">
                      {/* Custom posting instructions */}
                      <FormField
                        control={form.control}
                        name="customInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">
                              Posting instructions
                            </FormLabel>
                            <FormControl>
                              <AutosizeTextarea
                                placeholder="Describe what should be included in the results summary..."
                                className="resize-none min-h-[80px] text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Post To */}
                      <FormField
                        control={form.control}
                        name="postTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">
                              Post to
                            </FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Choose where to post" />
                                </SelectTrigger>
                                <SelectContent className="max-h-80">
                                  <SelectItem value="same">
                                    Same Session
                                  </SelectItem>
                                  <SelectItem value="another">
                                    Another Session
                                  </SelectItem>
                                  {availablePlatforms.includes('discord') && (
                                    <SelectItem value="discord">
                                      <div className="flex items-center gap-2">
                                        <DiscordIcon size={16} />
                                        Discord
                                      </div>
                                    </SelectItem>
                                  )}
                                  {availablePlatforms.includes('telegram') && (
                                    <SelectItem value="telegram">
                                      <div className="flex items-center gap-2">
                                        <TelegramIcon size={16} />
                                        Telegram
                                      </div>
                                    </SelectItem>
                                  )}
                                  {availablePlatforms.includes('x') && (
                                    <SelectItem value="x">
                                      <div className="flex items-center gap-2">
                                        <TwitterIcon size={16} />X
                                      </div>
                                    </SelectItem>
                                  )}
                                  {availablePlatforms.includes('farcaster') && (
                                    <SelectItem value="farcaster">
                                      <div className="flex items-center gap-2">
                                        <FarcasterIcon size={16} />
                                        Farcaster
                                      </div>
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Session Dropdown for posting - only shown if "Another Session" is selected */}
                      {form.watch('postTo') === 'another' && (
                        <FormField
                          control={form.control}
                          name="postToSessionId"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select session to post to" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-80">
                                    {isLoadingSessions ? (
                                      <SelectItem value="loading" disabled>
                                        <div className="py-1">
                                          Loading sessions...
                                        </div>
                                      </SelectItem>
                                    ) : sessions.length === 0 ? (
                                      <SelectItem value="no-sessions" disabled>
                                        <div className="py-1">
                                          No sessions found
                                        </div>
                                      </SelectItem>
                                    ) : (
                                      sessions
                                        .filter(
                                          (
                                            session,
                                          ): session is NonNullable<
                                            typeof session
                                          > => Boolean(session),
                                        )
                                        .map(session => (
                                          <SelectItem
                                            key={session._id}
                                            value={session._id}
                                          >
                                            <div className="py-1">
                                              {session.title ||
                                                `Session ${session._id.slice(
                                                  -6,
                                                )}`}
                                            </div>
                                          </SelectItem>
                                        ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Discord Channel Dropdown */}
                      {form.watch('postTo') === 'discord' &&
                        getChannelOptions.discordChannels.length > 0 && (
                          <FormField
                            control={form.control}
                            name="channelId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium">
                                  Discord Channel
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <SelectTrigger className="h-12">
                                      <SelectValue placeholder="Select Discord channel" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-80">
                                      {getChannelOptions.discordChannels.map(
                                        channel => (
                                          <SelectItem
                                            key={channel.id}
                                            value={channel.id}
                                          >
                                            <div className="py-1">
                                              {channel.note || channel.id}
                                            </div>
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                      {/* Telegram Channel Dropdown */}
                      {form.watch('postTo') === 'telegram' &&
                        getChannelOptions.telegramChannels.length > 0 && (
                          <FormField
                            control={form.control}
                            name="channelId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium">
                                  Telegram Channel
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <SelectTrigger className="h-12">
                                      <SelectValue placeholder="Select Telegram channel" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-80">
                                      {getChannelOptions.telegramChannels.map(
                                        channel => (
                                          <SelectItem
                                            key={channel.id}
                                            value={channel.id}
                                          >
                                            <div className="py-1">
                                              {channel.note || channel.id}
                                            </div>
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                      {/* Fallback input for Discord/Telegram when no channels configured */}
                      {((form.watch('postTo') === 'discord' &&
                        getChannelOptions.discordChannels.length === 0) ||
                        (form.watch('postTo') === 'telegram' &&
                          getChannelOptions.telegramChannels.length === 0)) && (
                        <FormField
                          control={form.control}
                          name="channelId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">
                                {form.watch('postTo') === 'discord'
                                  ? 'Discord Channel ID'
                                  : 'Telegram Channel ID'}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={`Enter ${form.watch(
                                    'postTo',
                                  )} channel ID`}
                                  className="h-12"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Schedule Section - only show when creating new task */}
            {!editingTask && (
              <div className="space-y-6 border-t pt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Schedule</h3>
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
                            <SelectContent className="max-h-80">
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
                              <SelectContent className="max-h-80">
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
                                <SelectContent className="max-h-80">
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
                            <Input
                              type="time"
                              value={field.value || ''}
                              onChange={field.onChange}
                              className="h-12"
                            />
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
                            <Popover modal={true}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    type="button"
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
                                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                              <Input
                                type="time"
                                value={field.value || ''}
                                onChange={field.onChange}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

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
