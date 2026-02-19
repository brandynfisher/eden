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

      {/* System Prompt */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">System Prompt</h3>
        <div className="bg-muted rounded-md p-3 max-h-96 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap break-words">
            {agentContext.agentSystemPrompt || '(empty)'}
          </pre>
        </div>
      </div>
    </>
  )
}
