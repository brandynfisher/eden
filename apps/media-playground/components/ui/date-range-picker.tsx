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
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  className?: string
  placeholder?: string
}

function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

const DateRangePicker: FC<DateRangePickerProps> = ({
  value,
  onChange,
  className,
  placeholder = 'Pick a date range',
}) => {
  const [isOpen, setIsOpen] = useState(false)

  // Internal selection state drives the calendar.
  // We still sync with external `value`—but we can suppress a single sync
  // when we purposely clear on open to avoid the "first click sets end" bug.
  const [range, setRange] = useState<DateRange | undefined>(value)
  const suppressNextExternalSync = useRef(false)

  useEffect(() => {
    if (suppressNextExternalSync.current) {
      suppressNextExternalSync.current = false
      return
    }
    setRange(value)
  }, [value])

  const label = useMemo(() => {
    if (!range?.from) return placeholder
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    return range.to ? `${fmt(range.from)} - ${fmt(range.to)}` : fmt(range.from)
  }, [range, placeholder])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // Start fresh so the first click sets `from`, not `to`.
      setRange(undefined)
      // Suppress an immediate resync from a stale parent `value`.
      suppressNextExternalSync.current = true
      // Notify parent so controlled parents can clear too.
      onChange?.(undefined)
    }
  }

  const handleSelect = (next: DateRange | undefined) => {
    // Accept DayPicker's semantics:
    // - first click sets `from`
    // - second click sets `to`
    // - clicking again after a full range starts a new range with only `from`
    setRange(next)
    onChange?.(next)

    if (next?.from && next?.to) {
      setIsOpen(false)
    }
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'justify-start text-left font-normal h-12',
              !range && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelect={handleSelect}
            defaultMonth={range?.from}
            // Avoid time-of-day edge cases for "today"
            disabled={d => d > endOfToday()}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DateRangePicker
