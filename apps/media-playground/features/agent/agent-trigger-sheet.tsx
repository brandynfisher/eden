'use client'

import { Button } from '@/components/ui/button'
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
import { AlertCircle, Loader2, RocketIcon } from 'lucide-react'

export const AgentTriggerFormSheet = () => {
  const { isOpen, agentId } = useAgentTriggerFormSheet()
  const dispatch = useAppDispatch()

  const triggersQuery = useAgentTriggersQuery({
    key: agentId || '',
    enabled: !!agentId && isOpen,
  })

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
            Configure your agent's scheduled tasks across different platforms.
          </SheetDescription>
          <TriggerCreateSheet agentId={agentId} />
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
            <TriggerList agentId={agentId} triggers={triggersQuery.triggers} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
