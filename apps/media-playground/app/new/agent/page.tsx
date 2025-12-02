'use client'

import { Bot, Settings2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CreateAgentChoicePage = () => {
  const router = useRouter()

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
        <h1 className="mb-8 text-center text-2xl font-semibold">
          How would you like to create your agent?
        </h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* AI Assisted Card */}
          <button
            onClick={() => router.push('/new/agent/chat')}
            className="group flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-left transition-all hover:border-primary hover:bg-accent"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                AI Assisted Agent Builder
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Setup your agent through a natural conversation with our agent
                builder that will guide you through the process.
              </p>
            </div>
          </button>

          {/* Manual Card */}
          <button
            onClick={() => router.push('/new/agent/manual')}
            className="group flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-left transition-all hover:border-primary hover:bg-accent"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Settings2 className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                Fully Custom Instructions
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                I know what I&apos;m doing, just let me set all of the agent
                prompts myself.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateAgentChoicePage
