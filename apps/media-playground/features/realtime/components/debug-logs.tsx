import { DebugLog } from '@/lib/voice/types'
import { FC } from 'react'

interface DebugLogsProps {
  logs: DebugLog[]
}

export const DebugLogs: FC<DebugLogsProps> = ({ logs }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-primary">Debug Logs</h3>
      <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto space-y-1">
        {logs.length === 0 ? (
          <div className="text-xs text-muted-foreground">No logs yet</div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className={`text-xs ${
                log.type === 'error'
                  ? 'text-red-500'
                  : log.type === 'success'
                  ? 'text-green-500'
                  : log.type === 'warning'
                  ? 'text-yellow-500'
                  : log.type === 'debug'
                  ? 'text-blue-500'
                  : 'text-foreground'
              }`}
            >
              <span className="text-muted-foreground">[{log.timestamp}]</span>{' '}
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
