'use client'

import AgentSelectorModal from '@/components/modal/agent-selector-modal'
import { Button } from '@/components/ui/button'
import { Agent } from '@edenlabs/eden-sdk'
import { MessageCircleIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'

const NewSession = () => {
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([])

  const handleAgentSelection = (agents: Agent[]) => {
    setSelectedAgents(agents)
    console.log('Selected agents:', agents)
    // TODO: Create session with selected agents
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <MessageCircleIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Start a New Session
          </h2>
          <p className="text-muted-foreground">
            Create a new session by selecting one or more agents to chat with.
          </p>
        </div>

        {selectedAgents.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-medium text-sm">Selected Agents:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedAgents.map(agent => (
                <div
                  key={agent._id}
                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  <UsersIcon className="w-3 h-3" />
                  {agent.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <AgentSelectorModal
            className="p-4 md:p-8 w-full"
            title="Select Agents for Session"
            description="Choose one or more agents to include in your new session. You can chat with multiple agents in the same conversation."
            selectedAgents={selectedAgents}
            onChange={handleAgentSelection}
            trigger={
              <Button className="w-full">
                <UsersIcon className="w-4 h-4 mr-2" />
                Select Agents
              </Button>
            }
          />

          {selectedAgents.length > 0 && (
            <Button variant="outline" className="w-full">
              Create Session with {selectedAgents.length}{' '}
              {selectedAgents.length === 1 ? 'Agent' : 'Agents'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewSession
