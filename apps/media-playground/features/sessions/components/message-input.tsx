'use client'

import { useTapToRecord } from '../hooks/use-tap-to-record'
import { Attachment, FileUploadProgress } from './attachment'
import { MentionInput, MentionInputRef } from './mention-input'
import { LightboxGallery } from '@/components/media/lightbox'
import { Button } from '@/components/ui/button'
import {
  AutosizeTextAreaRef,
  AutosizeTextarea,
} from '@/components/ui/custom/autoresize-textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { hasPreviewAccess } from '@/hooks/use-gated-resource'
import { uploadFileToS3 } from '@/lib/files'
import { openUserSettingsModal } from '@/lib/user-settings'
import { cn } from '@/lib/utils'
import {
  Agent,
  SessionPermissionLevel,
  SubscriptionTier,
} from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import {
  AlertTriangleIcon,
  CrownIcon,
  LoaderIcon,
  Maximize2Icon,
  MessageSquareIcon,
  MicIcon,
  PaperclipIcon,
  PencilOffIcon,
  RadioIcon,
  SendIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import * as z from 'zod'

const formSchema = z.object({
  content: z.string().trim().min(1),
})

const TEMP_MESSAGE_KEY = 'chat-temp-message'

// Character limits per subscription tier
const CHARACTER_LIMITS: Record<SubscriptionTier, number> = {
  [SubscriptionTier.Free]: 25000,
  [SubscriptionTier.Basic]: 50000,
  [SubscriptionTier.Pro]: 100000,
  [SubscriptionTier.Believer]: 200000,
  [SubscriptionTier.Admin]: 400000,
}

const SUBSCRIPTION_TIER_NAMES: Record<SubscriptionTier, string> = {
  [SubscriptionTier.Free]: 'Free',
  [SubscriptionTier.Basic]: 'Basic',
  [SubscriptionTier.Pro]: 'Pro',
  [SubscriptionTier.Believer]: 'Believer',
  [SubscriptionTier.Admin]: 'Admin',
}

const getCharacterLimit = (tier: SubscriptionTier | undefined): number => {
  return CHARACTER_LIMITS[tier ?? SubscriptionTier.Free]
}

const formatCharacterCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

type MessageInputProps = {
  sessionId: string
  onStreamingMessage?: (
    content: string,
    attachments?: string[],
    thinking?: boolean,
  ) => void
  enableVoiceInput?: boolean
  agent?: Agent // Optional agent prop for welcome screen
  placeholder?: string // Custom placeholder text
  expanded?: boolean // Start with expanded multi-line view
  onTranscribingChange?: (isTranscribing: boolean) => void // Callback when transcription state changes
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

type NativeWebViewBridge = {
  postMessage: (message: string) => void
}

const getNativeWebViewBridge = () => {
  if (typeof window === 'undefined') return undefined

  return (
    window as Window & {
      ReactNativeWebView?: NativeWebViewBridge
    }
  ).ReactNativeWebView
}

export const MessageInput = ({
  sessionId,
  onStreamingMessage,
  enableVoiceInput = false,
  agent,
  placeholder = 'Write a message...',
  expanded = false,
  onTranscribingChange,
}: MessageInputProps) => {
  const { user, verifyAuth } = useAuthState()
  const router = useRouter()
  const [isMultiline, setIsMultiline] = useState(expanded)
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
  const isThinkingEnabled = false
  const accept = 'image/*,video/*,/*'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const awaitingNativePermissionRef = useRef(false)
  const isNativeWebViewRef = useRef(false)
  const [showMention, setShowMention] = useState(false)
  const [mentionTrigger, setMentionTrigger] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const [showCharacterLimitModal, setShowCharacterLimitModal] = useState(false)
  const [isComposerExpanded, setIsComposerExpanded] = useState(false)
  const [showExpandButton, setShowExpandButton] = useState(false)
  const textareaRef = useRef<AutosizeTextAreaRef | null>(null)
  const mentionInputRef = useRef<MentionInputRef>(null)

  const renderAttachmentButton = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleAttachmentTrigger}
            disabled={isSubmitting}
          >
            <PaperclipIcon className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add attachments</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  // Character limit based on subscription tier
  const subscriptionTier = user?.subscriptionTier ?? SubscriptionTier.Free
  const characterLimit = getCharacterLimit(subscriptionTier)

  // Check if user has access to realtime features (requires Preview flag)
  const hasRealtimeAccess = hasPreviewAccess(user?.featureFlags)

  // Tap-to-record for voice input
  const handleVoiceTranscription = useCallback(
    (transcription: string) => {
      if (onStreamingMessage && transcription.trim()) {
        // Send the transcription directly as a message
        onStreamingMessage(transcription.trim(), [], isThinkingEnabled)
      }
    },
    [onStreamingMessage, isThinkingEnabled],
  )

  const {
    isRecording: isVoiceRecording,
    isTranscribing,
    toggleRecording,
    cancelRecording,
  } = useTapToRecord({
    onTranscription: handleVoiceTranscription,
    onTranscribingChange,
  })

  // Sync isMultiline with expanded prop when it changes
  useEffect(() => {
    if (expanded) {
      setIsMultiline(true)
    }
  }, [expanded])

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

  // Watch content for character count
  const watchedContent = useWatch({ control: form.control, name: 'content' })
  const characterCount = watchedContent?.length ?? 0
  const isOverLimit = characterCount > characterLimit
  const isNearLimit = characterCount > characterLimit * 0.9 // Warning at 90%
  const shouldShowCharacterCount = characterCount > characterLimit * 0.5 // Only show after 50%

  const updateExpandButtonVisibility = useCallback(() => {
    const el = textareaRef.current?.textArea
    if (!el) return
    const styles = window.getComputedStyle(el)
    const lineHeight = parseFloat(styles.lineHeight || '0') || 20
    const paddingTop = parseFloat(styles.paddingTop || '0') || 0
    const paddingBottom = parseFloat(styles.paddingBottom || '0') || 0
    const contentHeight = Math.max(
      0,
      el.scrollHeight - paddingTop - paddingBottom,
    )
    const lineCount = Math.round(contentHeight / lineHeight)
    setShowExpandButton(lineCount > 3)
  }, [])

  useEffect(() => {
    updateExpandButtonVisibility()
  }, [updateExpandButtonVisibility, watchedContent])

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
          const debugInfo = axios.isAxiosError(error)
            ? {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data,
                responseText: error.request?.responseText,
                requestUrl: error.config?.url,
              }
            : { message: (error as Error)?.message || String(error) }

          console.error('Upload error:', debugInfo, error)
          setAttachments(prev =>
            prev.map(a =>
              a.id === attachment.id ? { ...a, status: 'error' } : a,
            ),
          )
          toast.error(`Failed to upload file!`, {
            description: debugInfo.message || attachment.file.name,
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
    if (typeof window === 'undefined') return

    isNativeWebViewRef.current = !!getNativeWebViewBridge()

    const handleNativeMessage = (event: MessageEvent) => {
      if (!event.data) return

      let payload = event.data
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload)
        } catch {
          return
        }
      }

      if (
        payload?.type === 'PERMISSIONS_RESULT' &&
        awaitingNativePermissionRef.current
      ) {
        awaitingNativePermissionRef.current = false

        if (payload.cameraGranted && payload.storageGranted) {
          fileInputRef.current?.click()
        } else {
          alert(
            'Camera or storage permission was denied in the mobile app settings.',
          )
        }
      }
    }

    const handleDocumentMessage = (event: Event) => {
      handleNativeMessage(event as MessageEvent)
    }

    window.addEventListener('message', handleNativeMessage)
    document.addEventListener('message', handleDocumentMessage)

    return () => {
      window.removeEventListener('message', handleNativeMessage)
      document.removeEventListener('message', handleDocumentMessage)
    }
  }, [])

  const handleAttachmentTrigger = useCallback(() => {
    if (isSubmitting) return

    const bridge = getNativeWebViewBridge()

    if (bridge && isNativeWebViewRef.current) {
      awaitingNativePermissionRef.current = true
      bridge.postMessage(JSON.stringify({ type: 'CHECK_NATIVE_PERMISSIONS' }))
      return
    }

    fileInputRef.current?.click()
  }, [isSubmitting])

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

  // Check if any attachments are still uploading
  const hasUploadingAttachments = attachments.some(
    a => a.status === 'uploading',
  )

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (isSubmitting) return

    // Prevent submission while uploads are in progress
    if (hasUploadingAttachments) return

    // Check character limit
    if (data.content.length > characterLimit) {
      setShowCharacterLimitModal(true)
      return
    }

    // Check authentication and prompt login if needed
    if (!(await verifyAuth())) {
      return
    }

    setIsSubmitting(true)
    if (isComposerExpanded) {
      setIsComposerExpanded(false)
    }

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
    resetComposerState()
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
      requestAnimationFrame(() => {
        const textarea = textareaRef.current?.textArea
        const shouldBeMultiline =
          expanded || (!!data.content && (textarea?.scrollHeight ?? 0) > 40)
        if (shouldBeMultiline !== isMultiline) {
          setIsMultiline(shouldBeMultiline)
        }
        textareaRef.current?.resize?.()
      })

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
    // If expanded prop is set, stay in multiline mode even when empty
    // Otherwise, reset to single line if content is empty or very short
    const shouldBeMultiline =
      expanded || (value.length > 0 && e.target.scrollHeight > 40) // ~40px is roughly 2rem height

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

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!e.clipboardData) return
      const items = Array.from(e.clipboardData.items)

      // Check for image data in clipboard (screenshots, copied images)
      const imageFiles: File[] = []

      for (const item of items) {
        // Handle file items (images copied as files)
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) {
            imageFiles.push(file)
          }
        }
        // Handle image data from clipboard (screenshots, copy image from browser)
        // Some systems provide images as 'image/*' type even with kind !== 'file'
        else if (item.kind === 'string' && item.type.startsWith('image/')) {
          // This case is rare but can happen with some clipboard managers
          const file = item.getAsFile()
          if (file) {
            imageFiles.push(file)
          }
        }
      }

      // Also check clipboardData.files directly as a fallback
      // Some browsers populate this instead of/in addition to items
      if (imageFiles.length === 0 && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files)
        imageFiles.push(...files)
      }

      if (imageFiles.length > 0) {
        e.preventDefault()
        await handleFilesDropped(imageFiles)
      }
    },
    [handleFilesDropped],
  )

  const resetComposerState = useCallback(() => {
    setIsMultiline(expanded)
    setShowMention(false)
    setMentionTrigger('')
    setMentionPosition(0)
    requestAnimationFrame(() => {
      textareaRef.current?.resize?.()
    })
  }, [expanded])

  // Check if this is a read-only view (user doesn't own session and has no permissions)
  const permissionForUser = session?.permissions?.find(
    p => p.user?._id === user?._id,
  )

  const hasInteractivePermission =
    permissionForUser &&
    permissionForUser.level !== SessionPermissionLevel.Viewer

  const isOwner = session?.owner?._id === user?._id
  const isSessionUser = session?.users?.some(u => {
    if (!u || !user?._id) return false
    if (typeof u === 'string') return u === user._id
    return u._id === user._id
  })

  const isReadOnly =
    !!session &&
    !!user &&
    !isOwner &&
    !isSessionUser &&
    !hasInteractivePermission

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

  // Get next tier info for upgrade prompt
  const getNextTierInfo = () => {
    if (subscriptionTier >= SubscriptionTier.Believer) {
      return null // Already at max tier (excluding Admin)
    }
    const nextTier = (subscriptionTier + 1) as SubscriptionTier
    return {
      name: SUBSCRIPTION_TIER_NAMES[nextTier],
      limit: CHARACTER_LIMITS[nextTier],
    }
  }
  const nextTierInfo = getNextTierInfo()

  return (
    <>
      {/* Character Limit Warning Modal */}
      <Dialog
        open={showCharacterLimitModal}
        onOpenChange={setShowCharacterLimitModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="text-orange-400 h-5 w-5" />
              Message Too Long
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-col gap-3 pt-4">
                <p>
                  Your message has{' '}
                  <strong>{formatCharacterCount(characterCount)}</strong>{' '}
                  characters, which exceeds your limit of{' '}
                  <strong>{formatCharacterCount(characterLimit)}</strong>{' '}
                  characters.
                </p>
                <p className="text-muted-foreground">
                  Your current plan:{' '}
                  <strong className="capitalize">
                    {SUBSCRIPTION_TIER_NAMES[subscriptionTier]}
                  </strong>
                </p>
                {nextTierInfo && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <CrownIcon className="text-purple-400 h-4 w-4" />
                      <span className="font-medium text-purple-300">
                        Upgrade to {nextTierInfo.name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get up to{' '}
                      <strong>
                        {formatCharacterCount(nextTierInfo.limit)}
                      </strong>{' '}
                      characters per message and unlock more features.
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCharacterLimitModal(false)}
            >
              Edit Message
            </Button>
            {nextTierInfo && (
              <Button
                onClick={() => {
                  setShowCharacterLimitModal(false)
                  openUserSettingsModal('subscription')
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <CrownIcon className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isComposerExpanded} onOpenChange={setIsComposerExpanded}>
        <DialogContent className="max-w-3xl w-[min(960px,95vw)] h-[80vh] sm:h-[85vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Compose message</DialogTitle>
            <DialogDescription>
              Keep writing — send when you&apos;re ready.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <AutosizeTextarea
              value={watchedContent ?? ''}
              placeholder={placeholder}
              variant="xl"
              className="h-full min-h-[50vh] max-h-none"
              onChange={e => {
                form.setValue('content', e.target.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {renderAttachmentButton()}
            </div>
            <div className="flex items-center gap-2">
              {enableVoiceInput && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={cn('h-8 w-8', isTranscribing && 'text-blue-500')}
                  onClick={toggleRecording}
                  disabled={isSubmitting || isTranscribing}
                >
                  <MicIcon
                    className={cn('w-5 h-5', isTranscribing && 'animate-pulse')}
                  />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsComposerExpanded(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => form.handleSubmit(onSubmit)()}
                disabled={
                  !form.formState.isValid ||
                  hasUploadingAttachments ||
                  isSubmitting ||
                  isOverLimit
                }
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isDragging && (
        <AttachmentDropzone isDragging={isDragging} accept={accept} />
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
            {!isVoiceRecording && !isTranscribing && (
              <div className="px-2.5 py-2">
                {/* Multi-line layout: text on top, buttons on bottom */}
                {isMultiline ? (
                  <>
                    {/* Full-width textarea above */}
                    <div className="relative mb-2">
                      {showExpandButton && (
                        <button
                          type="button"
                          onClick={() => setIsComposerExpanded(true)}
                          className="absolute top-1 right-1 z-10 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          aria-label="Expand composer"
                        >
                          <Maximize2Icon className="h-4 w-4" />
                        </button>
                      )}
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <AutosizeTextarea
                                {...field}
                                ref={textareaRef}
                                placeholder={placeholder}
                                className={cn(
                                  'focus-visible:ring-0 border-none bg-transparent rounded-none focus-visible:ring-offset-0 py-0 px-0 resize-none max-h-[200px] w-full',
                                  showExpandButton && 'pr-8',
                                  expanded && !field.value
                                    ? 'min-h-[4.5rem]'
                                    : 'min-h-[2rem]',
                                )}
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
                                onPaste={handlePaste}
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
                        {renderAttachmentButton()}
                      </div>

                      {/* Right side buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Character count indicator - show after 50% of limit */}
                        {shouldShowCharacterCount && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={cn(
                                    'text-xs tabular-nums cursor-pointer select-none',
                                    isOverLimit && 'text-red-500 font-medium',
                                    isNearLimit &&
                                      !isOverLimit &&
                                      'text-orange-400',
                                    !isNearLimit &&
                                      !isOverLimit &&
                                      'text-muted-foreground',
                                  )}
                                  onClick={() => {
                                    if (isOverLimit || isNearLimit) {
                                      openUserSettingsModal('subscription')
                                    }
                                  }}
                                >
                                  {formatCharacterCount(characterCount)}/
                                  {formatCharacterCount(characterLimit)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isOverLimit ? (
                                  <p>
                                    Upgrade your{' '}
                                    <button
                                      className="text-purple-400 underline hover:text-purple-300"
                                      onClick={() =>
                                        openUserSettingsModal('subscription')
                                      }
                                    >
                                      subscription
                                    </button>{' '}
                                    to increase message limits
                                  </p>
                                ) : (
                                  <p>
                                    {formatCharacterCount(
                                      characterLimit - characterCount,
                                    )}{' '}
                                    characters remaining
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {enableVoiceInput && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className={cn(
                                    'h-8 w-8',
                                    isTranscribing && 'text-blue-500',
                                  )}
                                  onClick={toggleRecording}
                                  disabled={isSubmitting || isTranscribing}
                                >
                                  <MicIcon
                                    className={cn(
                                      'w-5 h-5',
                                      isTranscribing && 'animate-pulse',
                                    )}
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {isTranscribing
                                    ? 'Transcribing...'
                                    : 'Record voice message'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {/* Show realtime button when text is empty and user has realtime access, otherwise show send button */}
                        {!form.formState.isValid &&
                        agent?.username &&
                        hasRealtimeAccess ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 border-purple-500/50 text-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
                                  onClick={() =>
                                    router.push(`/realtime/${agent.username}`)
                                  }
                                  disabled={isSubmitting}
                                >
                                  <RadioIcon className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Start realtime conversation</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="submit"
                                  size="icon"
                                  variant="outline"
                                  className={cn(
                                    'h-8 w-8',
                                    isOverLimit &&
                                      'border-red-500/50 text-red-500',
                                  )}
                                  disabled={
                                    !form.formState.isValid ||
                                    hasUploadingAttachments ||
                                    isSubmitting ||
                                    isOverLimit
                                  }
                                >
                                  <SendIcon
                                    className={cn(
                                      'w-5 h-5',
                                      isSubmitting && 'animate-pulse',
                                    )}
                                  />
                                </Button>
                              </TooltipTrigger>
                              {isOverLimit && (
                                <TooltipContent>
                                  <p className="text-red-400">
                                    Message exceeds character limit
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        )}
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
                      {renderAttachmentButton()}
                    </div>

                    {/* Inline textarea */}
                    <div className="relative flex-1 min-w-0">
                      {showExpandButton && (
                        <button
                          type="button"
                          onClick={() => setIsComposerExpanded(true)}
                          className="absolute top-0 right-0 z-10 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          aria-label="Expand composer"
                        >
                          <Maximize2Icon className="h-4 w-4" />
                        </button>
                      )}
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <AutosizeTextarea
                                {...field}
                                ref={textareaRef}
                                placeholder={placeholder}
                                className={cn(
                                  'focus-visible:ring-0 border-none bg-transparent rounded-none focus-visible:ring-offset-0 py-0 px-2 resize-none min-h-[2rem] max-h-[2rem]',
                                  showExpandButton && 'pr-8',
                                )}
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
                                onPaste={handlePaste}
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Character count indicator - show after 50% of limit */}
                      {shouldShowCharacterCount && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={cn(
                                  'text-xs tabular-nums cursor-pointer select-none',
                                  isOverLimit && 'text-red-500 font-medium',
                                  isNearLimit &&
                                    !isOverLimit &&
                                    'text-orange-400',
                                  !isNearLimit &&
                                    !isOverLimit &&
                                    'text-muted-foreground',
                                )}
                                onClick={() => {
                                  if (isOverLimit || isNearLimit) {
                                    openUserSettingsModal('subscription')
                                  }
                                }}
                              >
                                {formatCharacterCount(characterCount)}/
                                {formatCharacterCount(characterLimit)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isOverLimit ? (
                                <p>
                                  Upgrade your{' '}
                                  <button
                                    className="text-purple-400 underline hover:text-purple-300"
                                    onClick={() =>
                                      openUserSettingsModal('subscription')
                                    }
                                  >
                                    subscription
                                  </button>{' '}
                                  to increase message limits
                                </p>
                              ) : (
                                <p>
                                  {formatCharacterCount(
                                    characterLimit - characterCount,
                                  )}{' '}
                                  characters remaining
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {enableVoiceInput && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className={cn(
                                  'h-8 w-8',
                                  isTranscribing && 'text-blue-500',
                                )}
                                onClick={toggleRecording}
                                disabled={isSubmitting || isTranscribing}
                              >
                                <MicIcon
                                  className={cn(
                                    'w-5 h-5',
                                    isTranscribing && 'animate-pulse',
                                  )}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {isTranscribing
                                  ? 'Transcribing...'
                                  : 'Record voice message'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {/* Show realtime button when text is empty and user has realtime access, otherwise show send button */}
                      {!form.formState.isValid &&
                      agent?.username &&
                      hasRealtimeAccess ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 border-purple-500/50 text-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
                                onClick={() =>
                                  router.push(`/realtime/${agent.username}`)
                                }
                                disabled={isSubmitting}
                              >
                                <RadioIcon className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Start realtime conversation</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="submit"
                                size="icon"
                                variant="outline"
                                className={cn(
                                  'h-8 w-8',
                                  isOverLimit &&
                                    'border-red-500/50 text-red-500',
                                )}
                                disabled={
                                  !form.formState.isValid ||
                                  hasUploadingAttachments ||
                                  isSubmitting ||
                                  isOverLimit
                                }
                              >
                                <SendIcon
                                  className={cn(
                                    'w-5 h-5',
                                    isSubmitting && 'animate-pulse',
                                  )}
                                />
                              </Button>
                            </TooltipTrigger>
                            {isOverLimit && (
                              <TooltipContent>
                                <p className="text-red-400">
                                  Message exceeds character limit
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recording indicator when voice recording is active */}
            {enableVoiceInput && isVoiceRecording && (
              <div className="relative bg-orange-500/10 border-t border-orange-500/30 px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <MicIcon className="w-6 h-6 text-orange-400" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full animate-pulse" />
                    </div>
                    <span className="text-sm font-medium text-orange-300">
                      Recording...
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={cancelRecording}
                      className="h-7 px-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={toggleRecording}
                      className="h-7 px-3 border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                    >
                      Stop & Send
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Transcribing indicator when audio is being transcribed */}
            {enableVoiceInput && isTranscribing && (
              <div className="relative bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LoaderIcon className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Transcribing your message...
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={cancelRecording}
                    className="h-7 px-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  >
                    <XIcon className="w-4 h-4 mr-1" />
                    Cancel
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
