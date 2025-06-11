'use client'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { TriggerCreateSheet } from '@/features/agent/trigger-sheet/trigger-create-sheet'
import { TriggerList } from '@/features/agent/trigger-sheet/trigger-list'
import { useAgentTriggersQuery } from '@/hooks/query/use-agent-triggers-query'
import { useAgentTriggerFormSheet } from '@/stores/dialogs/dialogs.selector'
import { updateAgentTriggerFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { AlertCircle, ChevronDownIcon, Loader2, RocketIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

export const AgentTriggerFormSheet = () => {
  const { isOpen, agentId } = useAgentTriggerFormSheet()
  const dispatch = useAppDispatch()
  const [showFinished, setShowFinished] = useState(false)

  const triggersQuery = useAgentTriggersQuery({
    key: agentId || '',
    enabled: !!agentId && isOpen,
  })

  const { activeTriggers, finishedTriggers } = useMemo(() => {
    const allTriggers = triggersQuery.triggers || []

    const finished = allTriggers.filter(trigger => {
      // Check if trigger has status 'finished'
      if (trigger.status === 'finished') {
        return true
      }

      // Also check if trigger has an end_date that has passed
      if (trigger.schedule?.end_date) {
        const endDate = new Date(trigger.schedule.end_date)
        const currentDate = new Date()
        return endDate <= currentDate
      }

      return false
    })

    const active = allTriggers.filter(trigger => {
      // Check if trigger has status 'finished'
      if (trigger.status === 'finished') {
        return false
      }

      // Also check if trigger has an end_date that has passed
      if (trigger.schedule?.end_date) {
        const endDate = new Date(trigger.schedule.end_date)
        const currentDate = new Date()
        return endDate > currentDate
      }

      return true
    })

    return { activeTriggers: active, finishedTriggers: finished }
  }, [triggersQuery.triggers])

  const onOpenChange = async (open: boolean) => {
    dispatch(updateAgentTriggerFormSheet({ isOpen: open }))
  }

  if (!agentId) {
    return null
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <RocketIcon size={18} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:!max-w-2xl">
        <SheetHeader>
          <SheetTitle>Scheduled Tasks</SheetTitle>
          <SheetDescription>
            Configure your agent's scheduled tasks.
          </SheetDescription>
          {triggersQuery.isSuccess && <TriggerCreateSheet agentId={agentId} />}
        </SheetHeader>
        {triggersQuery.isPending && (
          <div className="flex items-center justify-center mt-10">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}
        {triggersQuery.isError && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <AlertCircle className="size-4 text-destructive" />
            <p className="text-destructive">
              We were unable to fetch agent triggers. Please try again later.
            </p>
          </div>
        )}
        {triggersQuery.isSuccess && (
          <div className="flex flex-col flex-1 space-y-4 mt-4">
            {/* Active Triggers */}
            <div>
              <h3 className="text-sm font-medium mb-3">Active Tasks</h3>
              <TriggerList agentId={agentId} triggers={activeTriggers} />
            </div>

            {/* Finished Triggers - Collapsible Section */}
            {finishedTriggers.length > 0 && (
              <Collapsible open={showFinished} onOpenChange={setShowFinished}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto"
                  >
                    <h3 className="text-sm font-medium">
                      Finished Tasks ({finishedTriggers.length})
                    </h3>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform ${
                        showFinished ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <TriggerList agentId={agentId} triggers={finishedTriggers} />
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
