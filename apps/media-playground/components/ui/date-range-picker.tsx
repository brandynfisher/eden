'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { FC, useState } from 'react'
import { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  className?: string
  placeholder?: string
}

const DateRangePicker: FC<DateRangePickerProps> = ({
  value,
  onChange,
  className,
  placeholder = 'Pick a date range',
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const formatDateRange = (range?: DateRange) => {
    if (!range?.from) return placeholder

    const from = range.from.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    if (!range.to) return from

    const to = range.to.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    return `${from} - ${to}`
  }

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      // Clear selection
      onChange?.(undefined)
      return
    }

    // First click: clear current selection and set start date
    if (!value?.from || (value?.from && value?.to)) {
      onChange?.({ from: range.from, to: undefined })
      return
    }

    // Second click: set end date and close modal
    if (value?.from && !value?.to && range?.to) {
      // Ensure end date is not before start date
      if (range.to >= value.from) {
        onChange?.({ from: value.from, to: range.to })
      } else {
        // If clicked date is before start date, swap them
        onChange?.({ from: range.to, to: value.from })
      }
      setIsOpen(false)
    }
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={date => date > new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DateRangePicker
