import { ToolCall } from '@/lib/voice/types'
import { FC } from 'react'

interface ToolCallsDisplayProps {
  toolCalls: ToolCall[]
}

export const ToolCallsDisplay: FC<ToolCallsDisplayProps> = ({ toolCalls }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-primary">Tool Calls</h3>
      <div className="bg-muted rounded-md p-3 max-h-64 overflow-y-auto space-y-3">
        {toolCalls.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            No tool calls yet. Ask the agent to perform an action.
          </div>
        ) : (
          toolCalls.map((call, idx) => (
            <div
              key={idx}
              className="border border-border rounded-md p-2 bg-background"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary">
                  {call.toolName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {call.timestamp}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Parameters:
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(call.parameters, null, 2)}
                  </pre>
                </div>
                {call.result !== undefined && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Result:
                    </div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {typeof call.result === 'string'
                        ? call.result
                        : JSON.stringify(call.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
