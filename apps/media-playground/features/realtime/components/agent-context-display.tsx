import {
  AgentContext,
  DynamicVariables,
} from '@/lib/voice/build-dynamic-variables'
import { FC } from 'react'

interface AgentContextDisplayProps {
  agentContext: AgentContext
  dynamicVariables: DynamicVariables
}

export const AgentContextDisplay: FC<AgentContextDisplayProps> = ({
  agentContext,
  dynamicVariables,
}) => {
  return (
    <>
      {/* Dynamic Variables Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">
            Dynamic Variables (sent to ElevenLabs)
          </h3>
          <span className="text-xs text-muted-foreground">
            {Object.keys(dynamicVariables).length} variables
          </span>
        </div>
        <div className="bg-muted rounded-md p-3 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {Object.entries(dynamicVariables).map(([key, value]) => (
              <div key={key} className="border-l-2 border-primary pl-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-primary">
                    {`{{${key}}}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {value ? `${value.length} chars` : 'empty'}
                  </span>
                </div>
                {value && value.length > 0 ? (
                  <pre className="text-xs whitespace-pre-wrap break-words text-muted-foreground">
                    {value.length > 200
                      ? `${value.substring(0, 200)}...`
                      : value}
                  </pre>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    (empty)
                  </span>
                )}
              </div>
            ))}
          </div>
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
