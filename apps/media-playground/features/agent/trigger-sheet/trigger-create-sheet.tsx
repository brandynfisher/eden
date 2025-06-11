import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
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
import {
  TriggerRepeatOptions,
  triggerRepeatOptions,
} from '@/features/agent/trigger-sheet/trigger-repeat-options'
import { TriggerScheduleField } from '@/features/agent/trigger-sheet/trigger-schedule-field'
import { useAgentTriggersQuery } from '@/hooks/query/use-agent-triggers-query'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const createTriggerSchema = z.object({
  instructions: z.string().min(1, 'Instructions are required'),
  startDate: z.date(),
  repeat: z.nativeEnum(TriggerRepeatOptions),
  endDate: z.date().optional(),
  timezone: z.string(),
})

export type CreateTriggerDto = z.infer<typeof createTriggerSchema>

type TriggerCreateSheetProps = {
  agentId: string
}

export const TriggerCreateSheet = ({ agentId }: TriggerCreateSheetProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { invalidate } = useAgentTriggersQuery({
    key: agentId,
    enabled: false,
  })

  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const form = useForm<CreateTriggerDto>({
    resolver: zodResolver(createTriggerSchema),
    defaultValues: {
      instructions: '',
      startDate: new Date(),
      repeat: TriggerRepeatOptions.DOES_NOT_REPEAT,
      timezone: defaultTimezone,
    },
  })

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        instructions: '',
        startDate: new Date(),
        repeat: TriggerRepeatOptions.DOES_NOT_REPEAT,
        timezone: defaultTimezone,
      })
    }
  }, [isOpen, form, defaultTimezone])

  const onSubmit = async (values: CreateTriggerDto) => {
    try {
      const predefinedSchedule =
        triggerRepeatOptions.find(option => option.value === values.repeat)
          ?.schedule || {}

      const hour = values.startDate.getHours()
      const minute = values.startDate.getMinutes()

      const schedule = {
        ...predefinedSchedule,
        hour,
        minute,
        timezone: values.timezone,
        start_date: values.startDate,
        end_date: values.endDate,
      }

      if (values.repeat === TriggerRepeatOptions.DOES_NOT_REPEAT) {
        schedule.end_date = schedule.start_date
      }

      await axios.post(`/api/agents/${agentId}/triggers`, {
        instruction: values.instructions,
        schedule,
      })

      await invalidate()
      toast.success('Task created successfully')
      setIsOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to create task')
    }
  }

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
                    <AutosizeTextarea
                      placeholder="Enter instructions for the task"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TriggerScheduleField form={form} />

            <SheetFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
