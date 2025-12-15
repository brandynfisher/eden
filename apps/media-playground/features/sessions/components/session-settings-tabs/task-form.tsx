'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
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
import axios from 'axios'
import { addMinutes, format } from 'date-fns'
import { ArrowLeftIcon, CalendarIcon, Loader2 } from 'lucide-react'
import { FC, useEffect, useRef, useState } from 'react'
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
    schedule: { dayOfWeek: '1' },
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

const taskSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    prompt: z.string().min(1, 'Instructions are required'),
    hasSchedule: z.boolean(),
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
    if (!data.hasSchedule) return

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
      }
    }
  })

type TaskFormDto = z.infer<typeof taskSchema>

type TaskFormProps = {
  sessionId?: string
  editingTask?: Trigger | null
  onCancel: () => void
  onSave: () => void
  hideHeader?: boolean
  disabled?: boolean
}

export const TaskForm: FC<TaskFormProps> = ({
  sessionId,
  editingTask,
  onCancel,
  onSave,
  hideHeader = false,
  disabled = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

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
      hasSchedule: false,
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

  const editingTaskIdRef = useRef<string | null>(null)

  // Reset form when editingTask changes
  useEffect(() => {
    const newTaskId = editingTask?._id || null
    const taskIdChanged = editingTaskIdRef.current !== newTaskId

    if (editingTask && (taskIdChanged || !form.formState.isDirty)) {
      editingTaskIdRef.current = newTaskId

      const hasSchedule = !!editingTask.schedule

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
  }, [editingTask, form, currentTime, defaultTimezone])

  const onSubmit = async (values: TaskFormDto) => {
    if (!sessionId) {
      toast.error('Session is required to create a task')
      return
    }

    try {
      let schedule: CronSchedule | undefined = undefined

      if (values.hasSchedule) {
        schedule = {
          timezone: values.timezone,
        }

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
        toast.success('Task updated')
      } else {
        const requestData = {
          name: values.name,
          prompt: values.prompt,
          session: sessionId,
          ...(schedule && { schedule }),
        }

        await axios.post('/api/triggers', requestData)
        toast.success('Task created')
      }

      await invalidate()
      onSave()
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
      toast.success('Task deleted')
      onSave()
    } catch {
      toast.error('Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 -ml-1.5 rounded-md hover:bg-muted"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <h3 className="font-medium">
            {editingTask ? 'Edit Task' : 'New Task'}
          </h3>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, () => {
            toast.error('Please fix the validation errors')
          })}
          className="space-y-4"
        >
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">
                  Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="Task name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Instructions */}
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">
                  Instructions
                </FormLabel>
                <FormControl>
                  <AutosizeTextarea
                    placeholder="What should this task do?"
                    className="resize-none min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Schedule Section */}
          <div>
            {!form.watch('hasSchedule') ? (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                onClick={() => form.setValue('hasSchedule', true)}
              >
                <CalendarIcon className="w-4 h-4" />
                Add schedule
              </button>
            ) : (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Schedule</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
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
                          <SelectTrigger>
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

                {/* Hourly - minute picker */}
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
                            <SelectTrigger>
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

                {/* Weekly - day picker */}
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
                            <SelectTrigger>
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

                {/* Monthly - day of month picker */}
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
                            <SelectTrigger>
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

                {/* Annually - month and day picker */}
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
                              <SelectTrigger>
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
                              <SelectTrigger>
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

                {/* Time picker for daily/weekly/monthly/annually */}
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
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground',
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {editingTask ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={form.formState.isSubmitting || isDeleting}
                className="text-sm text-destructive hover:text-destructive/80 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete task'}
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={form.formState.isSubmitting || isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={disabled || form.formState.isSubmitting || isDeleting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
    </div>
  )
}
