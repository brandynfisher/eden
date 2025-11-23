import { ConnectionStatus as Status } from '@/lib/voice/types'
import { FC } from 'react'

interface ConnectionStatusProps {
  status: Status
  isSpeaking: boolean
  canSendFeedback: boolean
}

export const ConnectionStatus: FC<ConnectionStatusProps> = ({
  status,
  isSpeaking,
  canSendFeedback,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-primary">Connection Status</h3>
      <div className="bg-muted rounded-md p-3 text-xs space-y-1">
        <div>
          <strong>Status:</strong> {status}
        </div>
        <div>
          <strong>Is Speaking:</strong> {isSpeaking ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Can Send Feedback:</strong> {canSendFeedback ? 'Yes' : 'No'}
        </div>
      </div>
    </div>
  )
}
