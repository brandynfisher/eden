'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
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
import { useUserTriggersQuery } from '@/hooks/query/use-user-triggers-query'
import { cn } from '@/lib/utils'
import { CronSchedule, Trigger } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import axios from 'axios'
import { addMinutes, format } from 'date-fns'
import { CalendarIcon, Loader2, TrashIcon, X } from 'lucide-react'
import { FC } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Extended repeat options for the simplified interface
export enum ExtendedTriggerRepeatOptions {
  DOES_NOT_REPEAT = 'DOES_NOT_REPEAT',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ANNUALLY = 'annually',
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
    name: 'Hourly',
    value: ExtendedTriggerRepeatOptions.HOURLY,
    schedule: { hour: '*' },
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

// Simplified task schema
const taskSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    prompt: z.string().min(1, 'Instructions are required'),
    hasSchedule: z.boolean(), // Toggle for schedule section
    startDate: z.date().optional(),
    repeat: z.nativeEnum(ExtendedTriggerRepeatOptions),
    time: z.string().optional(),
    minute: z.string().optional(),
    dayOfWeek: z.string().optional(),
    dayOfMonth: z.string().optional(),
    month: z.string().optional(),
    endDate: z.date().optional(),
    timezone: z.string(),
  })
  .superRefine((data, ctx) => {
    // Skip schedule validation if hasSchedule is false
    if (!data.hasSchedule) {
      return
    }

    // Validate schedule fields based on repeat type
    if (data.repeat === ExtendedTriggerRepeatOptions.HOURLY && !data.minute) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please select a minute',
        path: ['minute'],
      })
    }

    if (
      data.repeat === ExtendedTriggerRepeatOptions.WEEKLY &&
      !data.dayOfWeek
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please select a day of the week',
        path: ['dayOfWeek'],
      })
    }

    if (
      data.repeat === ExtendedTriggerRepeatOptions.MONTHLY &&
      !data.dayOfMonth
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please select a day of the month',
        path: ['dayOfMonth'],
      })
    }

    if (data.repeat === ExtendedTriggerRepeatOptions.ANNUALLY) {
      if (!data.month) {
        ctx.addIssue({
          code: 'custom',
          message: 'Please select a month',
          path: ['month'],
        })
      }
      if (!data.dayOfMonth) {
        ctx.addIssue({
          code: 'custom',
          message: 'Please select a day',
          path: ['dayOfMonth'],
        })
      }
    }

    // Validate that tasks are scheduled at least 2 minutes in the future
    if (
      data.repeat === ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT &&
      data.startDate &&
      data.time
    ) {
      const [hour, minute] = data.time.split(':').map(Number)
      const scheduledDateTime = new Date(data.startDate)
      scheduledDateTime.setHours(hour, minute, 0, 0)

      const minimumTime = addMinutes(new Date(), 2)

      if (scheduledDateTime < minimumTime) {
        ctx.addIssue({
          code: 'custom',
          message: 'Tasks must be scheduled at least 2 minutes in the future',
          path: ['startDate'],
        })
        ctx.addIssue({
          code: 'custom',
          message: 'Tasks must be scheduled at least 2 minutes in the future',
          path: ['time'],
        })
      }
    }
  })

type TaskFormDto = z.infer<typeof taskSchema>

const TaskFormModal: FC<{
  sessionId?: string
  editingTask?: Trigger | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}> = ({ sessionId, editingTask, open, onOpenChange, onSave }) => {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    React.useState(false)

  const { invalidate } = useUserTriggersQuery({
    enabled: false,
  })

  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const currentTime = format(new Date(), 'HH:mm')

  const form = useForm<TaskFormDto>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: '',
      prompt: '',
      hasSchedule: false, // Schedule disabled by default
      startDate: addMinutes(new Date(), 3),
      repeat: ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT,
      time: format(addMinutes(new Date(), 3), 'HH:mm'),
      minute: undefined,
      dayOfWeek: undefined,
      dayOfMonth: undefined,
      month: undefined,
      timezone: defaultTimezone,
    },
  })

  // Track the initial editing task ID to prevent resets from object reference changes
  const editingTaskIdRef = React.useRef<string | null>(null)

  // Reset form when editingTask changes
  React.useEffect(() => {
    const newTaskId = editingTask?._id || null

    const taskIdChanged = editingTaskIdRef.current !== newTaskId

    if (editingTask && (taskIdChanged || !form.formState.isDirty)) {
      editingTaskIdRef.current = newTaskId

      // Check if task has a schedule
      const hasSchedule = !!editingTask.schedule

      // Determine the repeat type from the schedule (if exists)
      let repeat = ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT
      if (hasSchedule && editingTask.schedule) {
        if (editingTask.schedule.hour === '*') {
          repeat = ExtendedTriggerRepeatOptions.HOURLY
        } else if (editingTask.schedule.day_of_week === '*') {
          repeat = ExtendedTriggerRepeatOptions.DAILY
        } else if (editingTask.schedule.day_of_week) {
          repeat = ExtendedTriggerRepeatOptions.WEEKLY
        } else if (editingTask.schedule.month && editingTask.schedule.day) {
          repeat = ExtendedTriggerRepeatOptions.ANNUALLY
        } else if (editingTask.schedule.day) {
          repeat = ExtendedTriggerRepeatOptions.MONTHLY
        }
      }

      const formData = {
        name: editingTask.name || '',
        prompt: editingTask.prompt || '',
        hasSchedule,
        startDate: editingTask.schedule?.start_date
          ? new Date(editingTask.schedule.start_date)
          : addMinutes(new Date(), 3),
        repeat,
        time:
          editingTask.schedule?.hour !== undefined &&
          editingTask.schedule?.minute !== undefined
            ? `${editingTask.schedule.hour
                .toString()
                .padStart(2, '0')}:${editingTask.schedule.minute
                .toString()
                .padStart(2, '0')}`
            : editingTask.schedule?.start_date
            ? format(new Date(editingTask.schedule.start_date), 'HH:mm')
            : currentTime,
        minute: editingTask.schedule?.minute?.toString() || undefined,
        dayOfWeek: editingTask.schedule?.day_of_week?.toString() || undefined,
        dayOfMonth: editingTask.schedule?.day?.toString() || undefined,
        month: editingTask.schedule?.month?.toString() || undefined,
        timezone: editingTask.schedule?.timezone || defaultTimezone,
      }

      form.reset(formData)
    } else if (!editingTask) {
      editingTaskIdRef.current = null
    }
  }, [editingTask, form, currentTime, defaultTimezone])

  // Reset form when modal is closed
  React.useEffect(() => {
    if (!open) {
      editingTaskIdRef.current = null
      const minimumDateTime = addMinutes(new Date(), 3)
      form.reset({
        name: '',
        prompt: '',
        hasSchedule: false,
        startDate: minimumDateTime,
        repeat: ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT,
        time: format(minimumDateTime, 'HH:mm'),
        minute: undefined,
        dayOfWeek: undefined,
        dayOfMonth: undefined,
        month: undefined,
        timezone: defaultTimezone,
      })
    }
  }, [open, form, defaultTimezone])

  const onSubmit = async (values: TaskFormDto) => {
    if (!sessionId) {
      toast.error('Session is required to create a task')
      return
    }

    try {
      // Only build schedule if hasSchedule is true
      let schedule: CronSchedule | undefined = undefined

      if (values.hasSchedule) {
        schedule = {
          timezone: values.timezone,
        }

        // Handle different repeat options
        if (values.repeat === ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT) {
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
          switch (values.repeat) {
            case ExtendedTriggerRepeatOptions.HOURLY:
              schedule.hour = '*'
              if (values.minute) {
                schedule.minute = parseInt(values.minute, 10)
              }
              break
            case ExtendedTriggerRepeatOptions.DAILY:
              schedule.day_of_week = '*'
              if (values.time) {
                const [hour, minute] = values.time.split(':').map(Number)
                schedule.hour = hour
                schedule.minute = minute
              }
              break
            case ExtendedTriggerRepeatOptions.WEEKLY:
              if (values.dayOfWeek) {
                schedule.day_of_week = values.dayOfWeek
              }
              if (values.time) {
                const [hour, minute] = values.time.split(':').map(Number)
                schedule.hour = hour
                schedule.minute = minute
              }
              break
            case ExtendedTriggerRepeatOptions.MONTHLY:
              if (values.dayOfMonth) {
                schedule.day = values.dayOfMonth
              }
              if (values.time) {
                const [hour, minute] = values.time.split(':').map(Number)
                schedule.hour = hour
                schedule.minute = minute
              }
              break
            case ExtendedTriggerRepeatOptions.ANNUALLY:
              if (values.month && values.dayOfMonth) {
                schedule.month = values.month
                schedule.day = values.dayOfMonth
              }
              if (values.time) {
                const [hour, minute] = values.time.split(':').map(Number)
                schedule.hour = hour
                schedule.minute = minute
              }
              break
          }

          schedule.start_date = new Date()

          if (values.endDate) {
            schedule.end_date = values.endDate
          }
        }
      }

      if (editingTask) {
        const updateData: Partial<Trigger> = {
          name: values.name,
          prompt: values.prompt,
          ...(schedule && { schedule }),
        }

        await axios.patch(`/api/triggers/${editingTask._id}`, updateData)
        toast.success('Task updated successfully')
      } else {
        const requestData = {
          name: values.name,
          prompt: values.prompt,
          session: sessionId,
          ...(schedule && { schedule }),
        }
        await axios.post('/api/triggers', requestData)
        toast.success('Task created successfully')
      }

      await invalidate()
      onSave()
      onOpenChange(false)
    } catch {
      toast.error(
        editingTask ? 'Failed to update task' : 'Failed to create task',
      )
    }
  }

  const handleDelete = async () => {
    if (!editingTask) return

    setIsDeleting(true)
    try {
      await axios.delete(`/api/triggers/${editingTask._id}`)
      await invalidate()
      toast.success('Task deleted successfully')
      onSave()
      onOpenChange(false)
    } catch {
      toast.error('Failed to delete task')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirmation(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-5 pt-5 pb-4">
            <DialogTitle className="text-lg font-medium">
              {editingTask ? 'Edit Task' : 'New Task'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, () => {
                toast.error('Please fix the validation errors')
              })}
              className="space-y-4 px-5"
            >
              {/* Name and Instructions */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm text-muted-foreground">
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Task name"
                          className="h-9"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm text-muted-foreground">
                        Instructions
                      </FormLabel>
                      <FormControl>
                        <AutosizeTextarea
                          placeholder="What should this task do?"
                          className="resize-none min-h-[80px] text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Schedule Section */}
              <div className="pt-2">
                {!form.watch('hasSchedule') ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                    onClick={() => form.setValue('hasSchedule', true)}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Add schedule
                  </button>
                ) : (
                  <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                    {/* Schedule Header with Remove Option */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Schedule
                      </span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => form.setValue('hasSchedule', false)}
                      >
                        Remove
                      </button>
                    </div>

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
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Frequency" />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                {extendedTriggerRepeatOptions.map(option => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.name}
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
                      ExtendedTriggerRepeatOptions.HOURLY && (
                      <FormField
                        control={form.control}
                        name="minute"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Minute" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {Array.from({ length: 60 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                      :{i.toString().padStart(2, '0')}
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
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Day" />
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
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Day" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {Array.from({ length: 31 }, (_, i) => (
                                    <SelectItem
                                      key={i + 1}
                                      value={(i + 1).toString()}
                                    >
                                      {i + 1}
                                      {i + 1 === 1
                                        ? 'st'
                                        : i + 1 === 2
                                        ? 'nd'
                                        : i + 1 === 3
                                        ? 'rd'
                                        : 'th'}
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
                      <div className="grid grid-cols-2 gap-2">
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
                                  <SelectTrigger className="h-9 text-sm">
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
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Day" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {Array.from({ length: 31 }, (_, i) => (
                                      <SelectItem
                                        key={i + 1}
                                        value={(i + 1).toString()}
                                      >
                                        {i + 1}
                                        {i + 1 === 1
                                          ? 'st'
                                          : i + 1 === 2
                                          ? 'nd'
                                          : i + 1 === 3
                                          ? 'rd'
                                          : 'th'}
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

                    {/* Time picker for all except "doesn't repeat" and "hourly" */}
                    {form.watch('repeat') !==
                      ExtendedTriggerRepeatOptions.DOES_NOT_REPEAT &&
                      form.watch('repeat') !==
                        ExtendedTriggerRepeatOptions.HOURLY && (
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
                                  className="h-9 text-sm"
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
                      <div className="grid grid-cols-2 gap-2">
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
                                        'w-full h-9 justify-start text-left font-normal text-sm',
                                        !field.value && 'text-muted-foreground',
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                      {field.value ? (
                                        format(field.value, 'MMM d, yyyy')
                                      ) : (
                                        <span>Date</span>
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
                                <Input
                                  type="time"
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  className="h-9 text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between py-4 px-5 border-t bg-muted/30 -mx-5 mt-4">
                {/* Delete Button - only show when editing */}
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={form.formState.isSubmitting || isDeleting}
                    className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                ) : (
                  <div />
                )}

                {/* Cancel and Save buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    disabled={form.formState.isSubmitting || isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={form.formState.isSubmitting || isDeleting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : editingTask ? (
                      'Save'
                    ) : (
                      'Create'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <DialogPortal>
          <DialogOverlay className="z-[100]" />
          <DialogPrimitive.Content
            className={cn(
              'fixed left-[50%] top-[50%] z-[100] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
            )}
          >
            <DialogHeader>
              <DialogTitle>Delete Task?</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this task? This action cannot be
                undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  )
}

export default TaskFormModal
