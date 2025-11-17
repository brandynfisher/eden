import { ConnectionStatus } from '@/lib/voice/types'
import { FC } from 'react'

interface StatusIndicatorProps {
  status: ConnectionStatus
  isSpeaking: boolean
}

export const StatusIndicator: FC<StatusIndicatorProps> = ({
  status,
  isSpeaking,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500/20 text-green-600 dark:text-green-400'
      case 'connecting':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
      case 'error':
        return 'bg-red-500/20 text-red-600 dark:text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">Status:</span>
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}
      >
        {status}
      </span>
      {isSpeaking && (
        <span className="text-sm text-primary animate-pulse">
          🔊 Agent is speaking...
        </span>
      )}
    </div>
  )
}
