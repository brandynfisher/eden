'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AutosizeTextAreaRef,
  AutosizeTextarea,
} from '@/components/ui/custom/autoresize-textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { useAuthState } from '@/hooks/use-auth-state'
import { AgentBasicInfo } from '@/lib/actions/agent'
import { cn } from '@/lib/utils'
import {
  Agent,
  AgentSuggestion,
  ThreadsCreateArguments,
  ThreadsCreateResponse,
} from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError, AxiosInstance } from 'axios'
import {
  ExternalLinkIcon,
  Keyboard,
  Loader2Icon,
  PlusIcon,
  SendIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export interface AgentConfig extends Agent {
  greeting: string
}

type Props = {
  agents: AgentBasicInfo[]
  initialAgentId?: string
}

const chatMockSchema = z.object({
  message: z.string().min(1).max(30000),
  attachments: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof chatMockSchema>

interface StoredFormData extends FormData {
  selectedAgentId?: string
}

const FORM_STORAGE_KEY = 'chat-mock-form-state'

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

  const { verifyAuth, isSignedIn } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [shouldShowHint, setShouldShowHint] = useState(false)

  const defaultValues: FormData = {
    message: '',
    attachments: [],
  }

  const [initialFormData, setInitialFormData] =
    useState<FormData>(defaultValues)
  const [hasStoredData, setHasStoredData] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(chatMockSchema),
    defaultValues: initialFormData,
  })

  const textareaRef = React.useRef<AutosizeTextAreaRef>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(FORM_STORAGE_KEY)
      if (stored) {
        const parsed: StoredFormData = JSON.parse(stored)
        const { selectedAgentId: storedAgentId, ...formData } = parsed
        setInitialFormData(formData)
        if (storedAgentId) {
          setSelectedAgentId(storedAgentId)
        }
        setHasStoredData(true)
        form.reset(formData)
      }
    } catch (e) {
      console.error('Error reading stored form state:', e)
    }
  }, [])

  const message = form.watch('message')

  useEffect(() => {
    const messageLength = message?.length || 0
    setShouldShowHint(messageLength > 3)
  }, [message])

  const handleSubmit = async (formData: FormData) => {
    if (!(await verifyAuth())) {
      const currentFormData = form.getValues()
      const storedData: StoredFormData = {
        ...currentFormData,
        selectedAgentId,
      }
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(storedData))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await axios.post<
        AxiosInstance,
        { data: ThreadsCreateResponse & { message_id?: string } },
        ThreadsCreateArguments
      >('/api/threads', {
        agent_id: selectedAgentId,
        content: formData.message,
        attachments: formData.attachments,
      })

      if (!response || !response.data || !response.data?.thread_id) {
        toast.error(`Failed to create thread!`, {
          description: JSON.stringify(response),
          dismissible: true,
          richColors: true,
        })
        return
      }

      // Store the message data in localStorage with a different key
      const messageData = {
        content: formData.message,
        attachments: formData.attachments,
        message_id: response.data.message_id,
        timestamp: Date.now(),
      }
      localStorage.setItem(
        `pending-message-${response.data.thread_id}`,
        JSON.stringify(messageData),
      )

      // Navigate to the chat view with the message data
      router.push(
        `/chat/${agent?.username}/${
          response.data.thread_id
        }?pending=true&message_id=${response.data.message_id || ''}`,
      )
    } catch (err) {
      setIsSubmitting(false)

      const errorMessage = axios.isAxiosError(err)
        ? JSON.parse((err as AxiosError).request.responseText)?.message
        : 'Unknown Error'

      toast.error(`Failed to create thread!`, {
        description: JSON.stringify(errorMessage),
        dismissible: true,
        richColors: true,
      })
    } finally {
      localStorage.removeItem(FORM_STORAGE_KEY)
      setHasStoredData(false)
    }
  }

  useEffect(() => {
    const shouldAutoSubmit = isSignedIn && hasStoredData && !isSubmitting

    if (shouldAutoSubmit) {
      const formData = form.getValues()
      if (formData.message) {
        handleSubmit(formData)
      }
    }
  }, [isSignedIn, hasStoredData, isSubmitting])

  useEffect(() => {
    return () => {
      localStorage.removeItem(FORM_STORAGE_KEY)
    }
  }, [])

  const handleSuggestionClick = (prompt: string) => {
    form.setValue('message', prompt, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.resize()
      }
    }, 10)

    setTimeout(() => {
      form.handleSubmit(handleSubmit)()
    }, 20)
  }

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
              href={`/agents/${agent?.username}`}
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
          <Form {...form}>
            <form
              className="flex gap-2 w-full bg-popover border border-secondary rounded-lg p-2"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                name="message"
                render={({ field }) => (
                  <FormItem className="w-full relative">
                    <FormControl id={'message'}>
                      <AutosizeTextarea
                        className="w-full !border-none !ring-0 !outline-none !ring-offset-0"
                        placeholder="Type your message here..."
                        rows={2}
                        // minHeight={64}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value || ''}
                        disabled={isSubmitting}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if (form.formState.isValid && !isSubmitting) {
                              form.handleSubmit(handleSubmit)()
                            }
                          }
                        }}
                        ref={textareaRef}
                      />
                    </FormControl>
                    <FormMessage />
                    <div
                      className={cn(
                        'absolute bottom-0 right-0 flex items-center gap-1.5 text-xs text-muted-foreground transition-all duration-200 [@media(pointer:coarse)]:hidden',
                        shouldShowHint
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-2 pointer-events-none',
                      )}
                    >
                      <Keyboard className="h-3 w-3" />
                      <span className="opacity-70">
                        <Badge variant="outline" className="rounded-sm px-1.5">
                          Enter
                        </Badge>{' '}
                        to send,{' '}
                        <Badge variant="outline" className="px-1.5 rounded-sm">
                          Shift+Enter
                        </Badge>{' '}
                        for new line
                      </span>
                    </div>
                  </FormItem>
                )}
              />
              <div
                className={cn(
                  'flex justify-end transition-all opacity-50',
                  isSubmitting && 'opacity-75',
                  form.formState.isValid && 'opacity-100 ',
                )}
              >
                <Button
                  aria-label="Send message"
                  variant="secondary"
                  type="submit"
                  disabled={isSubmitting || !form.formState.isValid}
                >
                  {isSubmitting ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>

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
                        onClick={() => handleSuggestionClick(suggestion.prompt)}
                        disabled={isSubmitting}
                      >
                        {suggestion.label}
                      </Button>
                    )
                  },
                )}
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  )
}
