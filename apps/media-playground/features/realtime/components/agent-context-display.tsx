import { AgentContext } from '@/lib/voice/build-agent-prompt'
import { FC } from 'react'

interface AgentContextDisplayProps {
  agentContext: AgentContext
  agentPrompt: string
}

export const AgentContextDisplay: FC<AgentContextDisplayProps> = ({
  agentContext,
  agentPrompt,
}) => {
  return (
    <>
      {/* Agent Prompt Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">
            Agent Prompt (sent to ElevenLabs)
          </h3>
          <span className="text-xs text-muted-foreground">
            {agentPrompt.length} characters
          </span>
        </div>
        <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap break-words">
            {agentPrompt}
          </pre>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">Description</h3>
        <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap break-words">
            {agentContext.description || '(empty)'}
          </pre>
        </div>
      </div>

      {/* Persona */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">Persona</h3>
        <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap break-words">
            {agentContext.persona || '(empty)'}
          </pre>
        </div>
      </div>

      {/* User Memory */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">User Memory</h3>
        <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap break-words">
            {agentContext.memory.userMemory || '(empty)'}
          </pre>
        </div>
      </div>

      {/* Collective Memory */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">
          Collective Memory ({agentContext.memory.collectiveMemory.length}{' '}
          shards)
        </h3>
        <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto">
          {agentContext.memory.collectiveMemory.length === 0 ? (
            <div className="text-xs text-muted-foreground">(empty)</div>
          ) : (
            <div className="space-y-2">
              {agentContext.memory.collectiveMemory.map((shard, index) => (
                <div key={index} className="border-l-2 border-primary pl-3">
                  <div className="text-xs font-semibold text-primary mb-1">
                    {shard.shard_name}
                  </div>
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {shard.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
