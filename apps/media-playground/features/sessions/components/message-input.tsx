'use client'

import { useLiveAudio } from '../live-audio/live-audio-context'
import { LiveAudioManager } from '../live-audio/live-audio-manager'
import { Attachment, FileUploadProgress } from './attachment'
import { MentionInput, MentionInputRef } from './mention-input'
import { LightboxGallery } from '@/components/media/lightbox'
import { Button } from '@/components/ui/button'
import {
  AutosizeTextAreaRef,
  AutosizeTextarea,
} from '@/components/ui/custom/autoresize-textarea'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { uploadFileToS3 } from '@/lib/files'
import { cn } from '@/lib/utils'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import {
  ClockIcon,
  MessageSquareIcon,
  MicIcon,
  PaperclipIcon,
  PencilOffIcon,
  SendIcon,
  SquareIcon,
} from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import * as z from 'zod'

const formSchema = z.object({
  content: z.string().trim().min(1),
})

const TEMP_MESSAGE_KEY = 'chat-temp-message'

type MessageInputProps = {
  sessionId: string
  onStreamingMessage?: (
    content: string,
    attachments?: string[],
    thinking?: boolean,
  ) => void
  enableLiveAudio?: boolean
  agent?: Agent // Optional agent prop for welcome screen
}

type AttachmentDropzoneProps = {
  isDragging: boolean
  accept: string
}

const AttachmentDropzone = ({
  isDragging,
  accept,
}: AttachmentDropzoneProps) => {
  return (
    <div
      className={cn([
        'absolute inset-0 opacity-0 pointer-events-none bg-muted/50 border border-purple-600 rounded-md overflow-hidden z-[100] transition-opacity duration-200',
        isDragging ? 'opacity-100' : '',
      ])}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="bg-muted-darker border border-purple-600/50 rounded-lg p-6 backdrop-blur-sm text-center">
          <p className="text-base md:text-lg text-purple-600 font-medium">
            Drop attachments here
          </p>
          <div className="text-sm md:text-base text-muted-foreground mt-2">
            <span className="font-semibold">{accept}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const MessageInput = ({
  sessionId,
  onStreamingMessage,
  enableLiveAudio = false,
  agent: propAgent,
}: MessageInputProps) => {
  const { user, verifyAuth } = useAuthState()
  const [isMultiline, setIsMultiline] = useState(false)
  const {
    addOptimisticMessage,
    removeOptimisticMessage,
    data: session,
  } = useSessionQuery({
    sessionId,
    enabled: !!sessionId && sessionId !== 'new',
  })

  // Get full agent data for the first agent (most common case)
  const firstAgentId = session?.agents?.[0]?._id
  const { agent: fullAgent } = useAgentQuery({
    key: firstAgentId!,
    enabled: !!firstAgentId,
  })

  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const [attachments, setAttachments] = useState<FileUploadProgress[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false)
  const accept = 'image/*,video/*,/*'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showMention, setShowMention] = useState(false)
  const [mentionTrigger, setMentionTrigger] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const textareaRef = useRef<AutosizeTextAreaRef>(null)
  const mentionInputRef = useRef<MentionInputRef>(null)

  // Check if the agent has reasoning capability (high model profile)
  // Use prop agent if available (for welcome screen), otherwise use session agent
  const activeAgent = propAgent || fullAgent
  const hasReasoningAgent = activeAgent?.llm_settings?.model_profile === 'high'

  // Auto-focus the textarea when starting a new chat
  useEffect(() => {
    if (sessionId === 'new' && textareaRef.current?.textArea) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        textareaRef.current?.textArea?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [sessionId])

  // Check for stored message from homepage and auto-submit it
  useEffect(() => {
    if (sessionId !== 'new' || !onStreamingMessage) return

    try {
      const stored = sessionStorage.getItem(TEMP_MESSAGE_KEY)
      if (stored) {
        const { content, attachments, timestamp } = JSON.parse(stored)

        // Only use stored message if it's recent (within 5 minutes)
        const isRecent = Date.now() - timestamp < 5 * 60 * 1000

        if (isRecent && content) {
          // Clear the stored message immediately to prevent duplicate submissions
          sessionStorage.removeItem(TEMP_MESSAGE_KEY)

          // Submit the message
          onStreamingMessage(content, attachments || [])
        } else {
          // Clean up stale message
          sessionStorage.removeItem(TEMP_MESSAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Error retrieving stored message:', error)
      sessionStorage.removeItem(TEMP_MESSAGE_KEY)
    }
  }, [sessionId, onStreamingMessage])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  })

  const handleFilesDropped = useCallback(async (files: File[]) => {
    const newAttachments: FileUploadProgress[] = files.map(file => ({
      id: uuidv4(),
      file,
      progress: 0,
      source: null,
      status: 'uploading',
    }))

    setAttachments(prev => [...prev, ...newAttachments])

    for (const attachment of newAttachments) {
      const cancelSource = axios.CancelToken.source()
      try {
        const uploadedFile = await uploadFileToS3({
          file: attachment.file,
          onUploadProgress: progressEvent => {
            const progress = progressEvent.total
              ? progressEvent.loaded / progressEvent.total
              : 0
            setAttachments(prev =>
              prev.map(a =>
                a.id === attachment.id
                  ? { ...a, progress, source: cancelSource }
                  : a,
              ),
            )
          },
          cancelSource,
        })

        if (uploadedFile) {
          setAttachments(prev =>
            prev.map(a =>
              a.id === attachment.id
                ? {
                    ...a,
                    status: 'complete',
                    fileUrl: uploadedFile.fileUrl,
                  }
                : a,
            ),
          )
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Upload error:', error)
          setAttachments(prev =>
            prev.map(a =>
              a.id === attachment.id ? { ...a, status: 'error' } : a,
            ),
          )
          toast.error(`Failed to upload file!`, {
            description: attachment.file.name,
            dismissible: true,
            richColors: true,
          })
        }
      }
    }
  }, [])

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (files.length > 0) {
        await handleFilesDropped(files)
      }
      // Reset the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [handleFilesDropped],
  )

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current += 1
      if (dragCounter.current === 1) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current -= 1
      if (dragCounter.current === 0) {
        setIsDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)

      if (!e.dataTransfer) return

      const files = Array.from(e.dataTransfer.files || [])
      if (files.length > 0) {
        await handleFilesDropped(files)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [handleFilesDropped])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (isSubmitting) return

    // Check authentication and prompt login if needed
    if (!(await verifyAuth())) {
      return
    }

    setIsSubmitting(true)

    // Get completed attachments
    const completedAttachments = attachments
      .filter(a => a.status === 'complete' && a.fileUrl)
      .map(a => a.fileUrl!)

    // Add optimistic message immediately
    const optimisticId = addOptimisticMessage({
      content: data.content,
      sender: user,
      attachments: completedAttachments,
    })

    // Clear form and attachments immediately
    form.reset()
    setAttachments([])
    // Keep thinking mode state - don't reset after sending

    try {
      // Use streaming if available, otherwise fall back to regular message
      if (onStreamingMessage) {
        // Pass thinking state along with message
        onStreamingMessage(
          data.content,
          completedAttachments,
          isThinkingEnabled,
        )
      } else {
        // Send to server with thinking state as separate field
        const payload = {
          session_id: sessionId,
          content: data.content,
          attachments: completedAttachments,
          thinking: isThinkingEnabled,
        }
        await axios.post(`/api/sessions/${sessionId}/messages`, payload)
      }

      // Success - the websocket will handle updating with the real message
    } catch (error) {
      console.error('Failed to send message:', error)

      // Revert optimistic update
      removeOptimisticMessage(optimisticId)

      // Restore form content
      form.setValue('content', data.content)

      // Show error toast
      toast.error('Failed to send message', {
        description: 'Please try again',
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAttachment = (id: string) => {
    const attachment = attachments.find(a => a.id === id)
    if (attachment?.source) {
      attachment.source.cancel('Upload cancelled')
    }
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If mention dropdown is open, delegate navigation to it
    if (showMention && mentionInputRef.current) {
      const handled = mentionInputRef.current.handleKeyDown(e)
      if (handled) {
        e.preventDefault()
        e.stopPropagation()
        return true
      }
    }
    return false
  }

  const handleMentionSelect = (agent: Agent) => {
    const currentValue = form.getValues('content')
    const beforeMention = currentValue.slice(0, mentionPosition)
    const afterMention = currentValue.slice(
      mentionPosition + mentionTrigger.length + 1,
    )
    const newValue = `${beforeMention}@${agent.username} ${afterMention}`

    form.setValue('content', newValue)
    setShowMention(false)

    // Move cursor to after the mention
    const newCursorPosition = mentionPosition + agent.username.length + 2 // +2 for @ and space
    setTimeout(() => {
      const textarea = textareaRef.current?.textArea
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart

    // Check if textarea has multiple lines (wrapped or newline)
    const shouldBeMultiline = e.target.scrollHeight > 40 // ~40px is roughly 2rem height

    // Only update isMultiline state if it actually changed to prevent unnecessary re-renders
    if (shouldBeMultiline !== isMultiline) {
      setIsMultiline(shouldBeMultiline)

      // Refocus the textarea after state change to maintain cursor position
      setTimeout(() => {
        if (textareaRef.current?.textArea) {
          textareaRef.current.textArea.focus()
          textareaRef.current.textArea.setSelectionRange(
            cursorPosition,
            cursorPosition,
          )
        }
      }, 0)
    }

    // Check if we just typed an @ symbol
    if (!showMention && value[cursorPosition - 1] === '@') {
      // Check if it's at the start or preceded by a space/newline
      const charBefore = value[cursorPosition - 2]
      if (!charBefore || charBefore === ' ' || charBefore === '\n') {
        setMentionPosition(cursorPosition - 1)
        setMentionTrigger('')
        setShowMention(true)
      }
    } else if (showMention) {
      // Update the mention trigger text
      const textAfterAt = value.slice(mentionPosition + 1, cursorPosition)

      // If the cursor moved before the @, or @ was deleted, hide mention
      if (cursorPosition <= mentionPosition || value[mentionPosition] !== '@') {
        setShowMention(false)
      } else if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
        // If user typed space or newline, hide mention
        setShowMention(false)
      } else {
        setMentionTrigger(textAfterAt)
      }
    }
  }

  // Always call the hook to avoid conditional hook calls
  const liveAudioHook = useLiveAudio()
  const liveAudioState = liveAudioHook?.state ?? {
    isRecording: false,
    isProcessing: false,
    actionIntervalProgress: 0,
  }
  const { isRecording, isProcessing, actionIntervalProgress } = liveAudioState

  // Only enable live audio features for preview users
  const shouldShowLiveAudio = enableLiveAudio && isPreviewUser

  const handleRecordToggle = () => {
    if (!shouldShowLiveAudio || !liveAudioHook) return

    // This will trigger the modal to open via the LiveAudioManager
    const managerElement = document.querySelector('[data-live-audio-manager]')
    const managerWithToggle = managerElement as HTMLElement & {
      __toggleRecording?: () => void
    }
    if (managerElement && managerWithToggle.__toggleRecording) {
      managerWithToggle.__toggleRecording()
    }
  }

  const handleStopRecording = () => {
    if (!shouldShowLiveAudio || !liveAudioHook) return
    liveAudioHook.stopLiveAudio()
  }

  useEffect(() => {
    const textarea = textareaRef.current?.textArea
    if (!textarea) return

    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const items = Array.from(e.clipboardData.items)

      const files = items
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((f): f is File => f !== null)

      if (files.length > 0) {
        e.preventDefault()
        await handleFilesDropped(files)
      }
    }

    textarea.addEventListener('paste', handlePaste)
    return () => {
      textarea.removeEventListener('paste', handlePaste)
    }
  }, [handleFilesDropped])

  // Check if this is a read-only view (user doesn't own session and has no permissions)
  // User has access if they own the session OR if they have any permission level
  const hasPermission = session?.permissions?.some(
    p => p.user?._id === user?._id,
  )
  const isReadOnly =
    session && user && session.owner?._id !== user._id && !hasPermission

  // If read-only, show read-only indicator
  if (isReadOnly) {
    return (
      <div className="relative z-[51] bg-accent w-full">
        <div className="flex items-center justify-between gap-2 md:gap-3 py-2 px-2 md:px-4 h-[58px] w-full border border-aui-border bg-accent-foreground/5 rounded-lg">
          <div className="flex flex-wrap items-center gap-2 px-2 md:gap-3 py-2 md:px-4 border border-secondary rounded-lg bg-muted-darker">
            <PencilOffIcon className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm">
              Read-only view{' '}
              <span className="hidden lg:inline">
                of another user's session.
              </span>
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/chat" className="bg-purple-600/20 border-purple-600">
              <MessageSquareIcon className="w-4 h-4 mr-2" />
              <span className="text-sm">New Chat</span>
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {isDragging && (
        <AttachmentDropzone isDragging={isDragging} accept={accept} />
      )}

      {/* Live Audio Manager handles recording indicator and modal - only when enabled for preview users */}
      {shouldShowLiveAudio && (
        <LiveAudioManager
          sessionId={sessionId}
          onStreamingMessage={onStreamingMessage}
          isSubmitting={isSubmitting}
        />
      )}

      <div className="relative z-[51] bg-accent w-full">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={cn(
              'relative z-[51] border border-aui-border bg-accent-foreground/5 rounded-lg focus-within:border-aui-ring/20 transition-all duration-300 flex flex-col',
            )}
          >
            {/* Attachments section - shown above everything when present */}
            {attachments.length > 0 && (
              <div className="px-2.5 pt-2.5">
                <LightboxGallery>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map((attachment, index) => (
                      <Attachment
                        key={attachment.id}
                        attachment={attachment}
                        index={index}
                        onRemove={() => handleRemoveAttachment(attachment.id)}
                      />
                    ))}
                  </div>
                </LightboxGallery>
              </div>
            )}

            {/* Conditional layout based on text wrapping */}
            {!isRecording && (
              <div className="px-2.5 py-2">
                {/* Multi-line layout: text on top, buttons on bottom */}
                {isMultiline ? (
                  <>
                    {/* Full-width textarea above */}
                    <div className="relative mb-2">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <AutosizeTextarea
                                {...field}
                                ref={textareaRef}
                                placeholder="Write a message..."
                                className="focus-visible:ring-0 border-none bg-transparent rounded-none focus-visible:ring-offset-0 py-0 px-0 resize-none min-h-[2rem] max-h-[200px] w-full"
                                disabled={isSubmitting}
                                onKeyDown={e => {
                                  const mentionHandled = handleKeyDown(e)
                                  if (
                                    !mentionHandled &&
                                    e.key === 'Enter' &&
                                    !e.shiftKey
                                  ) {
                                    e.preventDefault()
                                    form.handleSubmit(onSubmit)()
                                  }
                                }}
                                onChange={e => {
                                  field.onChange(e)
                                  handleTextChange(e)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {showMention && session?.agents && (
                        <div className="absolute bottom-full mb-2">
                          <MentionInput
                            ref={mentionInputRef}
                            agents={session.agents}
                            onSelect={handleMentionSelect}
                            onClose={() => setShowMention(false)}
                            searchFilter={mentionTrigger}
                          />
                        </div>
                      )}
                    </div>

                    {/* Buttons row below */}
                    <div className="flex items-center justify-between">
                      {/* Left side buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept={accept}
                          onChange={handleFileSelect}
                          className="hidden"
                          multiple
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting}
                              >
                                <PaperclipIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add attachments</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Think toggle - only show for reasoning agents */}
                        {hasReasoningAgent && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={
                                    isThinkingEnabled ? 'default' : 'ghost'
                                  }
                                  className={cn(
                                    'h-8 px-2 transition-all flex items-center gap-1',
                                    isThinkingEnabled &&
                                      'bg-purple-600 hover:bg-purple-700 text-white shadow-md',
                                  )}
                                  onClick={() => {
                                    const newValue = !isThinkingEnabled
                                    setIsThinkingEnabled(newValue)
                                  }}
                                  disabled={isSubmitting}
                                >
                                  <ClockIcon className="w-4 h-4" />
                                  <span className="text-xs font-medium">
                                    Think
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {isThinkingEnabled
                                    ? 'Thinking enabled'
                                    : 'Enable thinking'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {/* Right side buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {shouldShowLiveAudio && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className={cn(
                                    'h-8 w-8',
                                    isProcessing && 'text-blue-500',
                                  )}
                                  onClick={handleRecordToggle}
                                  disabled={isSubmitting || isProcessing}
                                >
                                  <MicIcon
                                    className={cn(
                                      'w-4 h-4',
                                      isProcessing && 'animate-spin',
                                    )}
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Start audio session</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button
                          type="submit"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={
                            !form.formState.isValid ||
                            attachments.some(a => a.status === 'uploading') ||
                            isSubmitting
                          }
                        >
                          <SendIcon
                            className={cn(
                              'w-4 h-4',
                              isSubmitting && 'animate-pulse',
                            )}
                          />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Single row layout: textarea inline between buttons */
                  <div className="flex items-center gap-2">
                    {/* Left side buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileSelect}
                        className="hidden"
                        multiple
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isSubmitting}
                            >
                              <PaperclipIcon className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add attachments</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Think toggle */}
                      {hasReasoningAgent && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  isThinkingEnabled ? 'default' : 'ghost'
                                }
                                className={cn(
                                  'h-8 px-2 transition-all flex items-center gap-1',
                                  isThinkingEnabled &&
                                    'bg-purple-600 hover:bg-purple-700 text-white shadow-md',
                                )}
                                onClick={() => {
                                  const newValue = !isThinkingEnabled
                                  setIsThinkingEnabled(newValue)
                                }}
                                disabled={isSubmitting}
                              >
                                <ClockIcon className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  Think
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {isThinkingEnabled
                                  ? 'Thinking enabled'
                                  : 'Enable thinking'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    {/* Inline textarea */}
                    <div className="relative flex-1 min-w-0">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <AutosizeTextarea
                                {...field}
                                ref={textareaRef}
                                placeholder="Write a message..."
                                className="focus-visible:ring-0 border-none bg-transparent rounded-none focus-visible:ring-offset-0 py-0 px-2 resize-none min-h-[2rem] max-h-[2rem]"
                                disabled={isSubmitting}
                                onKeyDown={e => {
                                  const mentionHandled = handleKeyDown(e)
                                  if (
                                    !mentionHandled &&
                                    e.key === 'Enter' &&
                                    !e.shiftKey
                                  ) {
                                    e.preventDefault()
                                    form.handleSubmit(onSubmit)()
                                  }
                                }}
                                onChange={e => {
                                  field.onChange(e)
                                  handleTextChange(e)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {showMention && session?.agents && (
                        <div className="absolute bottom-full mb-2">
                          <MentionInput
                            ref={mentionInputRef}
                            agents={session.agents}
                            onSelect={handleMentionSelect}
                            onClose={() => setShowMention(false)}
                            searchFilter={mentionTrigger}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right side buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {shouldShowLiveAudio && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className={cn(
                                  'h-8 w-8',
                                  isProcessing && 'text-blue-500',
                                )}
                                onClick={handleRecordToggle}
                                disabled={isSubmitting || isProcessing}
                              >
                                <MicIcon
                                  className={cn(
                                    'w-4 h-4',
                                    isProcessing && 'animate-spin',
                                  )}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Start audio session</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Button
                        type="submit"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={
                          !form.formState.isValid ||
                          attachments.some(a => a.status === 'uploading') ||
                          isSubmitting
                        }
                      >
                        <SendIcon
                          className={cn(
                            'w-4 h-4',
                            isSubmitting && 'animate-pulse',
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom half - recording indicator when recording is active and live audio is enabled for preview users */}
            {shouldShowLiveAudio && isRecording && (
              <div className="relative bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 px-4 py-2 overflow-hidden">
                {/* Progress bar background */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-red-400/50 to-red-200/30 dark:from-red-500/30 dark:to-red-700/15 transition-all duration-100 ease-linear border-r border-red-300/50 dark:border-red-600/30"
                  style={{ width: `${actionIntervalProgress}%` }}
                />

                {/* Recording indicator content */}
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <MicIcon className="w-5 h-5 text-red-600" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      {isProcessing
                        ? 'Processing audio...'
                        : 'Agent is listening...'}
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleStopRecording}
                    className="h-7 px-3 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                  >
                    <SquareIcon className="w-3 h-3 mr-1 fill-current" />
                    Stop
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </>
  )
}
