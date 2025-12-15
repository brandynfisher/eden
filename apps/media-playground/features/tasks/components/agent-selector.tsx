'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { ArrowLeftIcon, Loader2 } from 'lucide-react'
import { FC, useEffect, useState } from 'react'

type AgentSelectorProps = {
  onSelect: (agent: Agent) => void
  onCancel: () => void
}

export const AgentSelector: FC<AgentSelectorProps> = ({
  onSelect,
  onCancel,
}) => {
  const { user } = useAuthState()
  const { lastAgents } = useUserPreferencesQuery({ enabled: !!user })

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showAgentModal, setShowAgentModal] = useState(false)

  // Get the default agent (first from lastAgents)
  const defaultAgentId = lastAgents?.[0]?._id
  const { agent: defaultAgent, isLoading: isLoadingDefaultAgent } =
    useAgentQuery({
      key: defaultAgentId,
      enabled: !!defaultAgentId && !selectedAgent,
    })

  // Set default agent when loaded
  useEffect(() => {
    if (defaultAgent && !selectedAgent) {
      setSelectedAgent(defaultAgent)
    }
  }, [defaultAgent, selectedAgent])

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowAgentModal(false)
  }

  const handleContinue = () => {
    if (selectedAgent) {
      onSelect(selectedAgent)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 -ml-1.5 rounded-md hover:bg-muted"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <h3 className="font-medium">Select Agent</h3>
      </div>

      {/* Agent Display */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Agent *</label>
        {isLoadingDefaultAgent && !selectedAgent ? (
          <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/30">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading agent...</span>
          </div>
        ) : selectedAgent ? (
          <button
            type="button"
            onClick={() => setShowAgentModal(true)}
            className="w-full flex items-center gap-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={
                  selectedAgent.userImage
                    ? getCloudfrontOriginalUrl(selectedAgent.userImage)
                    : undefined
                }
                alt={selectedAgent.name}
              />
              <AvatarFallback>
                {selectedAgent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{selectedAgent.name}</div>
              <div className="text-sm text-muted-foreground">
                @{selectedAgent.username}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">Change</div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowAgentModal(true)}
            className="w-full p-4 rounded-lg border border-dashed bg-muted/30 hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
          >
            Click to select an agent
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleContinue} disabled={!selectedAgent}>
          Continue
        </Button>
      </div>

      {/* Agent Selector Modal */}
      <SingleAgentSelectorModal
        open={showAgentModal}
        onOpenChange={setShowAgentModal}
        onSelect={handleAgentSelect}
      />
    </div>
  )
}
