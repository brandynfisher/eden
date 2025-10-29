'use client'

import { LiveAudioProvider } from '../live-audio/live-audio-context'
import { MessageInput } from './message-input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuthState } from '@/hooks/use-auth-state'
import { AgentBasicInfo } from '@/lib/actions/agent'
import { cn } from '@/lib/utils'
import { Agent, AgentSuggestion } from '@edenlabs/eden-sdk'
import { ExternalLinkIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FC, useCallback, useState } from 'react'
import React from 'react'
import { toast } from 'sonner'

export interface AgentConfig extends Agent {
  greeting: string
}

type Props = {
  agents: AgentBasicInfo[]
  initialAgentId?: string
}

const TEMP_MESSAGE_KEY = 'chat-temp-message'

const DEFAULT_SUGGESTIONS: AgentSuggestion[] = [
  {
    label: 'What tools can you use?',
    prompt: 'Can you list all the tools and capabilities you have access to?',
  },
  {
    label: 'Animate my logo',
    prompt:
      'I would like to animate my company logo. Can you help me with that?',
  },
  {
    label: 'Make sketches into art',
    prompt: 'I have a sketch, can you make it into an art piece?',
  },
  {
    label: 'Help me draft a character',
    prompt: 'I need help creating a character design. Can you assist me?',
  },
]

export const ChatMockWidget: FC<Props> = ({ agents, initialAgentId }) => {
  const [selectedAgentId, setSelectedAgentId] = useState(
    initialAgentId || agents[0]?._id,
  )
  const { user } = useAuthState()

  const agent = agents.find(a => a._id === selectedAgentId)

  const router = useRouter()

  const handleSendMessage = useCallback(
    async (content: string, attachments?: string[], thinking?: boolean) => {
      try {
        const selectedAgent = agents.find(a => a._id === selectedAgentId)
        if (!selectedAgent?.username) {
          toast.error('Agent not found or username missing.')
          return
        }

        // Store message in sessionStorage to be picked up by the chat page
        sessionStorage.setItem(
          TEMP_MESSAGE_KEY,
          JSON.stringify({
            content,
            attachments: attachments || [],
            thinking,
            timestamp: Date.now(),
          }),
        )

        // Navigate to the chat page - opens in current tab
        router.push(`/chat/${selectedAgent.username}`)
      } catch (err) {
        console.error('Error preparing chat initiation:', err)
        toast.error('Failed to prepare chat initiation.', {
          description: err instanceof Error ? err.message : 'Unknown error',
          dismissible: true,
          richColors: true,
        })
        sessionStorage.removeItem(TEMP_MESSAGE_KEY)
      }
    },
    [agents, selectedAgentId, router],
  )

  return (
    <div
      data-testid="chat-mock-widget"
      className="flex flex-col-reverse md:flex-row gap-4 h-full"
    >
      <div className="w-full md:min-w-[320px] md:max-w-[320px] rounded-lg bg-muted-darker/80 px-2 md:px-4 p-4 flex flex-col gap-4">
        {agents.map((agentConfig, index) => (
          <Button
            variant="ghost"
            key={`${agentConfig._id}-${index}`}
            onClick={() => setSelectedAgentId(agentConfig?._id)}
            className={cn(
              'flex text-left gap-4 p-2 rounded-lg transition-colors h-auto text-wrap',
              'hover:bg-secondary/30 border border-transparent group',
              selectedAgentId === agentConfig._id
                ? ' border-purple-600/40 bg-secondary/70'
                : '',
            )}
          >
            <div className="flex-shrink-0">
              <Avatar className="w-10 h-10">
                {agentConfig?.userImage && (
                  <AvatarImage
                    src={agentConfig?.userImage}
                    className="object-cover object-top"
                  />
                )}
                <AvatarFallback delayMs={250} className="">
                  {agentConfig?.name?.charAt(0).toUpperCase() || ''}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col flex-grow">
              <div
                className={cn(
                  'text-base font-bold ',
                  selectedAgentId === agentConfig._id ? 'text-purple-600' : '',
                )}
              >
                {agentConfig?.name}
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {agentConfig?.description}
              </div>
            </div>
          </Button>
        ))}
        <Link
          href={
            user
              ? `/creators/${user.username}?tab=agents&create=true`
              : '/sign-in'
          }
          className={cn(
            'flex items-center justify-center gap-3 p-2 h-[82px] rounded-lg transition-colors border-2 border-dashed ',
            ' hover:border-primary/40 group',
            'hover:bg-secondary/50',
          )}
        >
          <div className="flex items-center justify-center transition-colors rounded-full w-10 h-10 bg-secondary flex-shrink-0">
            <PlusIcon className="h-8 w-8 text-accent-foreground group-hover:text-purple-600" />
          </div>
          <div className="flex flex-col flex-grow">
            <div className="text-base font-bold group-hover:text-accent-foreground">
              Create Your Agent
            </div>
            <div className="text-sm text-muted-foreground ">
              Design your own custom AI assistant or character.
            </div>
          </div>
        </Link>
      </div>
      <div className="flex-1 flex flex-col rounded-lg bg-muted-darker/80">
        <div className="px-2 md:px-4 p-4 flex items-center gap-4 w-full shrink-0">
          <Avatar className="w-10 h-10">
            {agent?.userImage && (
              <AvatarImage
                src={agent?.userImage}
                className="object-cover object-top"
              />
            )}
            <AvatarFallback delayMs={250} className="">
              {agent?.name?.charAt(0).toUpperCase() || ''}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="font-medium">{agent?.name}</div>
            <div className="text-sm text-muted-foreground line-clamp-1">
              {agent?.description}
            </div>
          </div>
          <Button size="sm" variant="ghost" asChild>
            <Link
              key={`agent-details-${agent?.username}`}
              href={`/chat/${agent?.username}`}
              className="flex bg-muted-foreground/10 shrink-0 items-center text-xs text-accent-foreground hover:text-muted-foreground"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <Separator className="shrink-0" />
        <div className="flex flex-col flex-1 p-4 mb-4 px-2 md:px-4 items-center md:mb-12">
          <div className="inline-flex p-2 bg-purple-600/40 rounded-lg md:max-w-[80%]">
            {agent?.greeting || 'How can I help you today?'}
          </div>
        </div>
        <Separator className="shrink-0" />
        <div className="px-2 md:px-4 p-4 shrink-0">
          <LiveAudioProvider>
            <MessageInput
              sessionId="new"
              onStreamingMessage={handleSendMessage}
              enableLiveAudio={true}
              agent={agent as Agent}
            />
          </LiveAudioProvider>

          <div className="mt-4 border border-secondary rounded-lg p-4 bg-secondary/30">
            <div className="flex flex-wrap gap-2">
              {(agent?.suggestions || DEFAULT_SUGGESTIONS).map(
                (suggestion, index) => {
                  return (
                    <Button
                      aria-label={suggestion.label}
                      key={`${agent?._id || 'default'}-${
                        suggestion.label
                      }-${index}`}
                      variant="outline"
                      type="button"
                      size="sm"
                      className="text-xs justify-start w-fit rounded-xl shrink-0 md:min-w-[49%]"
                      onClick={() => handleSendMessage(suggestion.prompt)}
                    >
                      {suggestion.label}
                    </Button>
                  )
                },
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
