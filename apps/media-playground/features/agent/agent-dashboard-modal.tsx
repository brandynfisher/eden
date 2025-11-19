'use client'

import AgentDashboardView from '../sessions/views/agent-dashboard-view'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { Loader2 } from 'lucide-react'

interface AgentDashboardModalProps {
  agentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentDashboardModal({
  agentId,
  open,
  onOpenChange,
}: AgentDashboardModalProps) {
  const { agent, isLoading, isError } = useAgentQuery({ key: agentId })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{'Dashboard'}</DialogTitle>

        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading dashboard...</span>
            </div>
          </div>
        ) : isError || !agent ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <p className="text-destructive font-medium">
                Failed to load agent data
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Please try again later
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <AgentDashboardView agent={agent} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
