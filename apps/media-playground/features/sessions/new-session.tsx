'use client'

import { MessageCircleIcon } from 'lucide-react'

const NewSession = () => {
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
            Select an existing session from the sidebar or create a new one to
            begin your conversation.
          </p>
        </div>
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
          <p className="font-medium mb-2">Quick tip:</p>
          <p>
            Sessions allow you to have ongoing conversations with different
            contexts. Each session maintains its own history and can be resumed
            at any time.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NewSession
