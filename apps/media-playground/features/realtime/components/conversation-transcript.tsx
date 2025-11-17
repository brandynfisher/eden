import { TranscriptMessage } from '@/lib/voice/types'
import { FC } from 'react'

interface ConversationTranscriptProps {
  transcript: TranscriptMessage[]
}

export const ConversationTranscript: FC<ConversationTranscriptProps> = ({
  transcript,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-primary">
        Conversation Transcript
      </h3>
      <div className="bg-muted rounded-md p-3 max-h-64 overflow-y-auto space-y-2">
        {transcript.length === 0 ? (
          <div className="text-xs text-muted-foreground">No messages yet</div>
        ) : (
          transcript.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded ${
                msg.role === 'agent'
                  ? 'bg-primary/10 border-l-2 border-primary'
                  : 'bg-blue-500/10 border-l-2 border-blue-500'
              } ${!msg.isFinal ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <strong className="text-xs">
                  {msg.role === 'agent' ? '🤖 Agent' : '👤 User'}
                </strong>
                <span className="text-xs text-muted-foreground">
                  {msg.timestamp}
                  {!msg.isFinal && (
                    <span className="ml-2 text-yellow-500">Speaking...</span>
                  )}
                </span>
              </div>
              <div className="text-xs">{msg.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
