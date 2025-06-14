'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
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
import { TriggerCollapsibleFormGroup } from '@/features/agent/trigger-sheet/trigger-collapsible-form-group'
import { CreateTriggerDto } from '@/features/agent/trigger-sheet/trigger-create-sheet'
import { triggerRepeatOptions } from '@/features/agent/trigger-sheet/trigger-repeat-options'
import {
  TimezoneOption,
  getTimezones,
} from '@/features/agent/trigger-sheet/trigger-utils'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import has from 'lodash/has'
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface TriggerScheduleFieldProps {
  form: UseFormReturn<CreateTriggerDto>
}

export const TriggerScheduleField = ({ form }: TriggerScheduleFieldProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false)

  const timezones = useMemo<TimezoneOption[]>(() => getTimezones(), [])

  const handleTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: {
      value?: Date
      onChange: (date: Date) => void
    },
  ) => {
    if (!e.target.value) {
      const newDate = new Date(field.value || new Date())
      newDate.setHours(0)
      newDate.setMinutes(0)
      field.onChange(newDate)
      return
    }
    const [hours, minutes] = e.target.value.split(':').map(Number)
    const newDate = new Date(field.value || new Date())
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    field.onChange(newDate)
  }

  const repeat = form.watch('repeat')
  const showEndDate = repeat !== 'DOES_NOT_REPEAT'

  useEffect(() => {
    const hasErrors =
      has(form.formState.errors, 'repeat') ||
      has(form.formState.errors, 'startDate') ||
      has(form.formState.errors, 'timezone') ||
      has(form.formState.errors, 'endDate')

    if (hasErrors) {
      setIsOpen(true)
    }
  }, [form.formState.errors])

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <TriggerCollapsibleFormGroup
        isOpen={isOpen}
        label="Schedule"
        tooltip="Select the schedule for the task"
      />
      <CollapsibleContent
        className={cn([
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
            : '',
        ])}
      >
        <div className="space-y-4 p-4">
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
                        className="w-full justify-between font-normal"
                      >
                        {field.value
                          ? timezones.find(
                              timezone => timezone.value === field.value,
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
                    <PopoverContent className="w-auto p-0 z-[60]">
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
                      value={field.value ? format(field.value, 'HH:mm') : ''}
                      onChange={e => handleTimeChange(e, field)}
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
                    {triggerRepeatOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.name}
                      </SelectItem>
                    ))}
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
                          disabled={date => date < form.getValues('startDate')}
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="flex-1">
                      <Input
                        type="time"
                        value={field.value ? format(field.value, 'HH:mm') : ''}
                        onChange={e => handleTimeChange(e, field)}
                      />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
