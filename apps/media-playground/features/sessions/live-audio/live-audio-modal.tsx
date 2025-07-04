'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  liveInstructions: z.string().min(1, 'Live instructions are required'),
  actionInterval: z.number().min(10, 'Action interval must be at least 10 seconds').max(1800, 'Action interval cannot exceed 30 minutes'),
})

// Logarithmic scale conversion functions
const logToLinear = (logValue: number): number => {
  // Map from log scale (10s to 1800s) to linear scale (0 to 100)
  const minLog = Math.log(10)
  const maxLog = Math.log(1800)
  return ((Math.log(logValue) - minLog) / (maxLog - minLog)) * 100
}

const linearToLog = (linearValue: number): number => {
  // Map from linear scale (0 to 100) to log scale (10s to 1800s)
  const minLog = Math.log(10)
  const maxLog = Math.log(1800)
  const logValue = minLog + (linearValue / 100) * (maxLog - minLog)
  return Math.round(Math.exp(logValue))
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`
  } else {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) {
      return `${minutes}m`
    } else {
      return `${minutes}m ${remainingSeconds}s`
    }
  }
}

type LiveAudioModalProps = {
  isOpen: boolean
  onClose: () => void
  onStart: (data: { liveInstructions: string; actionInterval: number }) => void
  initialData?: {
    liveInstructions?: string
    actionInterval?: number
  }
}

export const LiveAudioModal = ({
  isOpen,
  onClose,
  onStart,
  initialData,
}: LiveAudioModalProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      liveInstructions: initialData?.liveInstructions || 'Tell me a joke based on the ongoing conversation.',
      actionInterval: initialData?.actionInterval || 10,
    },
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onStart(data)
    onClose()
  }

  const currentInterval = form.watch('actionInterval')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Live Audio Settings</DialogTitle>
          <DialogDescription>
            Configure your live audio session settings. These will be saved for future sessions with this agent.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="liveInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Live Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter detailed instructions for the agent during live conversation..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actionInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Action Interval: {formatDuration(currentInterval)}
                  </FormLabel>
                  <FormControl>
                    <div className="px-3">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[logToLinear(field.value)]}
                        onValueChange={(values) => {
                          const logValue = linearToLog(values[0])
                          field.onChange(logValue)
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>10s</span>
                        <span>1m</span>
                        <span>10m</span>
                        <span>30m</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Start Recording</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}