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
import { DiscordTriggerSection } from '@/features/agent/trigger-sheet/discord-trigger-section'
import { TelegramTriggerSection } from '@/features/agent/trigger-sheet/telegram-trigger-section'
import { TwitterTriggerSection } from '@/features/agent/trigger-sheet/twitter-trigger-section'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAgentTriggerFormSheet } from '@/stores/dialogs/dialogs.selector'
import { updateAgentTriggerFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { AlertCircle, Loader2, RocketIcon } from 'lucide-react'

const AgentTriggerFormSheet = () => {
  const { isOpen, agentId } = useAgentTriggerFormSheet()
  const dispatch = useAppDispatch()

  const deploymentsQuery = useAgentDeploymentsQuery({
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
      <SheetContent
        side="left"
        className="overflow-y-auto w-full sm:!max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Configure Triggers</SheetTitle>
          <SheetDescription>
            Configure your agent's triggers across different platforms.
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
            <DiscordTriggerSection
              agentId={agentId}
              deployment={deploymentsQuery.deployments?.find(
                deployment => deployment.platform === 'discord',
              )}
            />
            <TelegramTriggerSection
              agentId={agentId}
              deployment={deploymentsQuery.deployments?.find(
                deployment => deployment.platform === 'telegram',
              )}
            />
            <TwitterTriggerSection
              agentId={agentId}
              deployment={deploymentsQuery.deployments?.find(
                deployment => deployment.platform === 'twitter',
              )}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default AgentTriggerFormSheet
