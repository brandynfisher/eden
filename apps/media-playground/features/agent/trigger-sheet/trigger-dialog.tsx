import {
  Channel,
  FormValues,
  TimezoneOption,
  Trigger,
  determineRepeatType,
  formSchema,
  getTimezones,
  repeatValueToCronSchedule,
} from './trigger-utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Clock,
  GlobeIcon,
  MessageSquare,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

type TriggerDialogProps = {
  mode?: 'create' | 'edit'
  trigger?: Trigger
  channels: Channel[]
  agentId: string
  platform: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideChannels?: boolean
}

export const TriggerDialog = ({
  mode = 'create',
  trigger,
  channels = [],
  agentId,
  platform,
  open,
  onOpenChange,
  hideChannels = false,
}: TriggerDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const [showChannelSelect, setShowChannelSelect] = useState(false)
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const timezones = useMemo<TimezoneOption[]>(() => getTimezones(), [])
  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const isControlled = open !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  // Set up default values based on mode
  const defaultValues: FormValues = {
    instructions: '',
    channels: hideChannels ? ['default'] : [], // Use a default value when channels are hidden
    startDate: new Date(),
    repeat: 'DOES_NOT_REPEAT',
    endDate: undefined,
    timezone: defaultTimezone,
  }

  if (mode === 'edit' && trigger) {
    defaultValues.instructions = trigger.message
    defaultValues.channels = hideChannels
      ? ['default']
      : trigger.channels.map(c => c.id)
    defaultValues.startDate = trigger.schedule.start_date
    defaultValues.repeat = determineRepeatType(trigger.schedule)
    defaultValues.endDate = trigger.schedule.end_date
    defaultValues.timezone = trigger.schedule.timezone || defaultTimezone
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  })

  // Function to reset the dialog state
  const resetDialogState = useCallback(() => {
    setActiveTab('content')
    setAttemptedSubmit(false)
    setShowChannelSelect(false)
    setShowTimezoneSelect(false)
    form.reset(defaultValues)
  }, [form, defaultValues])

  // Reset form when the trigger changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && trigger) {
      form.reset({
        instructions: trigger.message,
        channels: hideChannels ? ['default'] : trigger.channels.map(c => c.id),
        startDate: trigger.schedule.start_date,
        repeat: determineRepeatType(trigger.schedule),
        endDate: trigger.schedule.end_date,
        timezone: trigger.schedule.timezone || defaultTimezone,
      })
    }
  }, [form, mode, trigger, hideChannels, defaultTimezone])

  // Reset the dialog state when it opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Use setTimeout to ensure reset happens after dialog close animation
      const timer = setTimeout(() => {
        resetDialogState()
      }, 300) // Typical dialog transition is around 200-300ms

      return () => clearTimeout(timer)
    }
  }, [isOpen, resetDialogState])

  const watchRepeat = form.watch('repeat')
  const showEndDate = watchRepeat !== 'DOES_NOT_REPEAT'

  // Get errors by field name for error indicators
  const getErrorsByTabName = useCallback(() => {
    const { errors } = form.formState
    const fieldNames = Object.keys(errors)

    return {
      content: fieldNames.some(name =>
        ['instructions', 'channels'].includes(name),
      ),
      schedule: fieldNames.some(name =>
        ['startDate', 'repeat', 'endDate'].includes(name),
      ),
      advanced: fieldNames.some(name => ['timezone'].includes(name)),
    }
  }, [form.formState])

  const tabErrors = getErrorsByTabName()

  const onSubmit = (values: FormValues) => {
    // Create the request payload
    const cronSchedule = repeatValueToCronSchedule(
      values.repeat,
      values.startDate,
      values.endDate,
      values.timezone,
    )

    const triggerData = {
      ...(mode === 'edit' && trigger ? { id: trigger.id } : {}),
      agentId,
      platform,
      channels: hideChannels ? [] : values.channels,
      instructions: values.instructions,
      schedule: cronSchedule,
    }

    // In a real implementation, this would send the data to the API
    console.log(
      `${mode === 'create' ? 'Create' : 'Update'} trigger data:`,
      triggerData,
    )

    // Close the dialog on submit
    setIsOpen(false)
  }

  // Function to handle next button clicks with validation
  const handleNextTab = (
    currentTab: string,
    nextTab: string,
    event?: React.MouseEvent,
  ) => {
    // Prevent the event from bubbling up or triggering default behavior
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Trigger validation only for fields in the current tab
    let fieldsToValidate: (keyof FormValues)[] = []

    if (currentTab === 'content') {
      fieldsToValidate = ['instructions']
      if (!hideChannels) fieldsToValidate.push('channels')
    } else if (currentTab === 'schedule') {
      fieldsToValidate = ['startDate', 'repeat']
      if (showEndDate) fieldsToValidate.push('endDate')
    } else if (currentTab === 'advanced') {
      fieldsToValidate = ['timezone']
    }

    // Validate the specific fields
    form.trigger(fieldsToValidate).then(isValid => {
      if (isValid) {
        setActiveTab(nextTab)
      }
    })
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={val => {
        if (!val) {
          // Reset attempted submit state when closing
          setAttemptedSubmit(false)
        }
        setIsOpen(val)
      }}
    >
      {mode === 'create' && (
        <DialogTrigger asChild>
          <Button className="w-fit self-end" variant="outline">
            Add Trigger
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-4">
        <DialogHeader>
          <DialogTitle className="text-center">
            {mode === 'create' ? 'Add New Trigger' : 'Edit Trigger'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={e => {
              e.preventDefault()
              setAttemptedSubmit(true)
              form.handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger
                  value="content"
                  className="flex items-center gap-2"
                  data-error={
                    tabErrors.content ||
                    (attemptedSubmit && form.formState.errors.instructions)
                  }
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Content</span>
                  {(tabErrors.content ||
                    (attemptedSubmit &&
                      (form.formState.errors.instructions ||
                        form.formState.errors.channels))) && (
                    <span className="h-2 w-2 rounded-full bg-destructive ml-1"></span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="schedule"
                  className="flex items-center gap-2"
                  data-error={tabErrors.schedule}
                >
                  <Clock className="h-4 w-4" />
                  <span>Schedule</span>
                  {(tabErrors.schedule ||
                    (attemptedSubmit &&
                      (form.formState.errors.startDate ||
                        form.formState.errors.repeat ||
                        form.formState.errors.endDate))) && (
                    <span className="h-2 w-2 rounded-full bg-destructive ml-1"></span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  className="flex items-center gap-2"
                  data-error={tabErrors.advanced}
                >
                  <GlobeIcon className="h-4 w-4" />
                  <span>Settings</span>
                  {(tabErrors.advanced ||
                    (attemptedSubmit && form.formState.errors.timezone)) && (
                    <span className="h-2 w-2 rounded-full bg-destructive ml-1"></span>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="relative min-h-[400px]">
                <TabsContent
                  value="content"
                  className="space-y-4 absolute top-0 left-0 w-full"
                  forceMount
                  hidden={activeTab !== 'content'}
                >
                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Trigger Instructions
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter instructions for the trigger"
                            className="resize-none min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!hideChannels && (
                    <FormField
                      control={form.control}
                      name="channels"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            Channels
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <Popover
                            open={showChannelSelect}
                            onOpenChange={setShowChannelSelect}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-between',
                                    !field.value?.length &&
                                      'text-muted-foreground',
                                  )}
                                >
                                  {field.value?.length > 0
                                    ? `${field.value.length} channel${
                                        field.value.length > 1 ? 's' : ''
                                      } selected`
                                    : 'Select channels'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0"
                              align="start"
                            >
                              <div className="p-1 max-h-72 overflow-auto">
                                {channels.map(channel => (
                                  <Button
                                    key={channel.value}
                                    variant="ghost"
                                    className="justify-start w-full"
                                    onClick={() => {
                                      const currentValues = field.value || []
                                      const newValues = currentValues.includes(
                                        channel.value,
                                      )
                                        ? currentValues.filter(
                                            value => value !== channel.value,
                                          )
                                        : [...currentValues, channel.value]

                                      field.onChange(newValues)
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                        field.value?.includes(channel.value)
                                          ? 'bg-primary border-primary'
                                          : 'opacity-50',
                                      )}
                                    >
                                      {field.value?.includes(channel.value) && (
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                      )}
                                    </div>
                                    {channel.label}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>

                <TabsContent
                  value="schedule"
                  className="space-y-4 absolute top-0 left-0 w-full"
                  forceMount
                  hidden={activeTab !== 'schedule'}
                >
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center">
                            Start Date & Time
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <div className="flex gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'w-full justify-start text-left font-normal',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, 'PPP')
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
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>

                            <div className="flex-1">
                              <Input
                                type="time"
                                value={
                                  field.value
                                    ? format(field.value, 'HH:mm')
                                    : ''
                                }
                                onChange={e => {
                                  const [hours, minutes] = e.target.value
                                    .split(':')
                                    .map(Number)
                                  const newDate = new Date(
                                    field.value || new Date(),
                                  )
                                  newDate.setHours(hours)
                                  newDate.setMinutes(minutes)
                                  field.onChange(newDate)
                                }}
                              />
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="repeat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            Repeat
                            <span className="text-muted-foreground text-xs ml-2">
                              (optional)
                            </span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a repeat option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DOES_NOT_REPEAT">
                                Does not repeat
                              </SelectItem>
                              <SelectItem value="HOURLY">Every hour</SelectItem>
                              <SelectItem value="DAILY">Every day</SelectItem>
                              <SelectItem value="WEEKDAYS">
                                Every weekday
                              </SelectItem>
                              <SelectItem value="WEEKENDS">
                                Every weekend
                              </SelectItem>
                              <SelectItem value="MONTHLY">
                                Every month
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {showEndDate && (
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center">
                              End Date & Time
                              <span className="text-muted-foreground text-xs ml-2">
                                (optional)
                              </span>
                            </FormLabel>
                            <div className="flex gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={'outline'}
                                      className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !field.value && 'text-muted-foreground',
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? (
                                        format(field.value, 'PPP')
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
                                    initialFocus
                                    disabled={date =>
                                      date < form.getValues('startDate')
                                    }
                                  />
                                </PopoverContent>
                              </Popover>

                              <div className="flex-1">
                                <Input
                                  type="time"
                                  value={
                                    field.value
                                      ? format(field.value, 'HH:mm')
                                      : ''
                                  }
                                  onChange={e => {
                                    if (!field.value) return
                                    const [hours, minutes] = e.target.value
                                      .split(':')
                                      .map(Number)
                                    const newDate = new Date(field.value)
                                    newDate.setHours(hours)
                                    newDate.setMinutes(minutes)
                                    field.onChange(newDate)
                                  }}
                                />
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="advanced"
                  className="space-y-4 absolute top-0 left-0 w-full"
                  forceMount
                  hidden={activeTab !== 'advanced'}
                >
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center">
                          Timezone
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <Popover
                          open={showTimezoneSelect}
                          onOpenChange={setShowTimezoneSelect}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={showTimezoneSelect}
                                className="w-full justify-between font-normal"
                              >
                                {field.value
                                  ? timezones.find(
                                      timezone =>
                                        timezone.value === field.value,
                                    )?.label || field.value
                                  : 'Select timezone...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Search timezone..." />
                              <CommandEmpty>No timezone found.</CommandEmpty>
                              <CommandGroup className="overflow-auto max-h-72">
                                {timezones.map((timezone: TimezoneOption) => (
                                  <CommandItem
                                    key={timezone.value}
                                    value={timezone.value}
                                    onSelect={() => {
                                      field.onChange(timezone.value)
                                      setShowTimezoneSelect(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        field.value === timezone.value
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                    {timezone.label}
                                    {timezone.current && (
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        current
                                      </span>
                                    )}
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

                  <div className="mt-4 border-t pt-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      <h4 className="font-medium text-foreground">Summary</h4>
                      <div className="mt-2 space-y-1">
                        <p>
                          <span className="font-semibold">Instructions:</span>{' '}
                          {form.getValues('instructions').substring(0, 50)}
                          {form.getValues('instructions').length > 50
                            ? '...'
                            : ''}
                        </p>
                        {!hideChannels && (
                          <p>
                            <span className="font-semibold">Channels:</span>{' '}
                            {form.getValues('channels').length} selected
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">Schedule:</span>{' '}
                          {format(form.getValues('startDate'), 'PPP p')}
                          {form.getValues('repeat') !== 'DOES_NOT_REPEAT' && (
                            <span>
                              , repeats{' '}
                              {form
                                .getValues('repeat')
                                .toLowerCase()
                                .replace('_', ' ')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Error summary that appears when there are errors and submit was attempted */}
            {attemptedSubmit &&
              Object.keys(form.formState.errors).length > 0 && (
                <div className="mt-4 p-3 border border-destructive/50 bg-destructive/10 rounded-md text-sm">
                  <p className="font-medium text-destructive mb-1">
                    Please fix the following errors:
                  </p>
                  <ul className="list-disc pl-5">
                    {form.formState.errors.instructions && (
                      <li className="text-destructive">
                        Instructions:{' '}
                        {form.formState.errors.instructions.message}
                      </li>
                    )}
                    {form.formState.errors.channels && (
                      <li className="text-destructive">
                        Channels: {form.formState.errors.channels.message}
                      </li>
                    )}
                    {form.formState.errors.startDate && (
                      <li className="text-destructive">
                        Start Date: {form.formState.errors.startDate.message}
                      </li>
                    )}
                    {form.formState.errors.repeat && (
                      <li className="text-destructive">
                        Repeat: {form.formState.errors.repeat.message}
                      </li>
                    )}
                    {form.formState.errors.endDate && (
                      <li className="text-destructive">
                        End Date: {form.formState.errors.endDate.message}
                      </li>
                    )}
                    {form.formState.errors.timezone && (
                      <li className="text-destructive">
                        Timezone: {form.formState.errors.timezone.message}
                      </li>
                    )}
                  </ul>
                </div>
              )}

            <DialogFooter className="pt-4 border-t mt-2">
              {activeTab === 'content' ? (
                <div className="flex justify-between w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={event =>
                      handleNextTab('content', 'schedule', event)
                    }
                  >
                    Next
                  </Button>
                </div>
              ) : activeTab === 'schedule' ? (
                <div className="flex justify-between w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={event => {
                      event.preventDefault()
                      setActiveTab('content')
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={event =>
                      handleNextTab('schedule', 'advanced', event)
                    }
                  >
                    Next
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={event => {
                      event.preventDefault()
                      setActiveTab('schedule')
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => {
                      // Check all form fields before submission
                      form.trigger()
                      setAttemptedSubmit(true)
                    }}
                  >
                    {mode === 'create' ? 'Create Trigger' : 'Update Trigger'}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
