'use client'

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { uploadFileToS3 } from '@/lib/files'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { MicIcon, PaperclipIcon, SendIcon, SquareIcon } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import * as z from 'zod'
import { LiveAudioManager } from '../live-audio/live-audio-manager'

const formSchema = z.object({
  content: z.string().trim().min(1),
})

type MessageInputProps = {
  sessionId: string
  onStreamingMessage?: (content: string, attachments?: string[]) => void
  onCancel?: () => void
  isStreaming?: boolean
  enableLiveAudio?: boolean
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
  onCancel,
  isStreaming,
  enableLiveAudio = false,
}: MessageInputProps) => {
  
  const { user } = useAuthState()
  const {
    addOptimisticMessage,
    removeOptimisticMessage,
    data: session,
  } = useSessionQuery({
    sessionId,
    enabled: !!sessionId && sessionId !== 'new',
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const [attachments, setAttachments] = useState<FileUploadProgress[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const accept = 'image/*,video/*,audio/*'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showMention, setShowMention] = useState(false)
  const [mentionTrigger, setMentionTrigger] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const textareaRef = useRef<AutosizeTextAreaRef>(null)
  const mentionInputRef = useRef<MentionInputRef>(null)

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
    if (!user || isSubmitting) return

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

    try {
      // Use streaming if available, otherwise fall back to regular message
      if (onStreamingMessage) {
        onStreamingMessage(data.content, completedAttachments)
      } else {
        // Send to server
        await axios.post(`/api/sessions/${sessionId}/messages`, {
          session_id: sessionId,
          content: data.content,
          attachments: completedAttachments,
        })
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
    const afterMention = currentValue.slice(mentionPosition + mentionTrigger.length + 1)
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

  const handleRecordToggle = () => {
    if (!enableLiveAudio) return
    
    // This will only work when LiveAudioManager is rendered
    const managerElement = document.querySelector('[data-live-audio-manager]')
    if (managerElement && (managerElement as any).__toggleRecording) {
      (managerElement as any).__toggleRecording()
    }
  }

  // Get live audio state from DOM for conditional rendering
  const getLiveAudioState = () => {
    if (!enableLiveAudio) return { isRecording: false, isProcessing: false }
    
    const managerElement = document.querySelector('[data-live-audio-manager]')
    if (managerElement) {
      return {
        isRecording: (managerElement as any).__isRecording || false,
        isProcessing: (managerElement as any).__isProcessing || false,
      }
    }
    return { isRecording: false, isProcessing: false }
  }

  const [liveAudioState, setLiveAudioState] = useState({ isRecording: false, isProcessing: false })

  // Auto-focus the textarea when component mounts (when session loads)
  useEffect(() => {
    const textarea = textareaRef.current?.textArea
    if (textarea) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        textarea.focus()
      }, 100)
    }
  }, [])

  // Poll for live audio state changes when enabled - reduced frequency
  useEffect(() => {
    if (!enableLiveAudio) return
    
    const interval = setInterval(() => {
      const newState = getLiveAudioState()
      setLiveAudioState(prev => {
        if (prev.isRecording !== newState.isRecording || prev.isProcessing !== newState.isProcessing) {
          return newState
        }
        return prev
      })
    }, 200) // Reduced from 100ms to 200ms
    
    return () => clearInterval(interval)
  }, [enableLiveAudio])

  const { isRecording, isProcessing } = liveAudioState

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

  return (
    <>
      {isDragging && (
        <AttachmentDropzone isDragging={isDragging} accept={accept} />
      )}
      
      {/* Live Audio Manager handles recording indicator and modal - only when enabled */}
      {enableLiveAudio && (
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
            className="relative z-[51] border border-aui-border bg-accent-foreground/5 rounded-lg items-start p-2.5 focus-within:border-aui-ring/20 transition-all duration-300"
          >
            {attachments.length > 0 && (
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
            )}

            <div className="flex gap-1 items-start">
              <Input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <TooltipProvider>
                <div className="flex flex-col gap-1">
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
                  {enableLiveAudio && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className={cn(
                            'h-8 w-8',
                            isRecording && 'text-red-500 animate-pulse',
                            isProcessing && 'text-blue-500'
                          )}
                          onClick={handleRecordToggle}
                          disabled={isSubmitting || isProcessing}
                        >
                          {isRecording ? (
                            <SquareIcon className="w-4 h-4 fill-current" />
                          ) : (
                            <MicIcon className={cn('w-4 h-4', isProcessing && 'animate-spin')} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Start audio session</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
              <div className="flex-1 relative">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <AutosizeTextarea
                          {...field}
                          ref={textareaRef}
                          placeholder="Write a message..."
                          className="focus-visible:ring-0 border-none bg-transparent rounded-none focus-visible:ring-offset-0 py-1"
                          disabled={isSubmitting}
                          onKeyDown={e => {
                            const mentionHandled = handleKeyDown(e)
                            // Only submit on Enter if mention dropdown didn't handle it
                            if (!mentionHandled && e.key === 'Enter' && !e.shiftKey) {
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
              {isStreaming ? (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 animate-pulse border-purple-500/50 hover:border-purple-500"
                  onClick={onCancel}
                >
                  <SquareIcon className="w-3 h-3 fill-current" />
                </Button>
              ) : (
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
                    className={cn('w-4 h-4', isSubmitting && 'animate-pulse')}
                  />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </>
  )
}
