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
import { DiscordDeploymentForm } from '@/features/agent/deployment-sheet/discord-deployment-form'
import { TelegramDeploymentForm } from '@/features/agent/deployment-sheet/telegram-deployment-form'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAgentDeploymentFormSheet } from '@/stores/dialogs/dialogs.selector'
import { updateAgentDeploymentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { AlertCircle, Loader2, RocketIcon } from 'lucide-react'

const AgentDeploymentFormSheet = () => {
  const { isOpen, agent } = useAgentDeploymentFormSheet()
  const dispatch = useAppDispatch()
  const deploymentsQuery = useAgentDeploymentsQuery({
    key: agent?._id || '',
    enabled: isOpen,
  })

  const onOpenChange = async (open: boolean) => {
    dispatch(updateAgentDeploymentFormSheet({ isOpen: open }))
  }

  if (!agent) {
    return null
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <RocketIcon size={18} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="overflow-y-auto w-full sm:!max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Configure Deployment</SheetTitle>
          <SheetDescription>
            Configure your agent's deployment settings across different
            platforms.
          </SheetDescription>
        </SheetHeader>
        {deploymentsQuery.isPending && (
          <div className="flex items-center justify-center mt-10">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}
        {deploymentsQuery.isError && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <AlertCircle className="size-4 text-destructive" />
            <p className="text-destructive">
              We were unable to fetch your deployments. Please try again later.
            </p>
          </div>
        )}
        {deploymentsQuery.isSuccess && (
          <div className="space-y-4 mt-4">
            <DiscordDeploymentForm
              agentId={agent?._id || ''}
              deployment={deploymentsQuery.deployments?.discord}
            />
            <TelegramDeploymentForm
              agentId={agent?._id || ''}
              deployment={deploymentsQuery.deployments?.telegram}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default AgentDeploymentFormSheet
