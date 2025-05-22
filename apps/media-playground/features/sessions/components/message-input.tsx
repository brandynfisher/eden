'use client'

import LoadingIndicator from '@/components/loading-indicator'
import { LightboxGallery } from '@/components/media/lightbox'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useAuthState } from '@/hooks/use-auth-state'
import { uploadFileToS3 } from '@/lib/files'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { CancelTokenSource } from 'axios'
import { PaperclipIcon, SendIcon } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import * as z from 'zod'

const formSchema = z.object({
  content: z.string().trim().min(1),
})

type MessageInputProps = {
  sessionId: string
}

type FileUploadProgress = {
  id: string
  file: File
  progress: number
  source: CancelTokenSource | null
  status: 'uploading' | 'complete' | 'error'
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

export const MessageInput = ({ sessionId }: MessageInputProps) => {
  const { user } = useAuthState()
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const [attachments, setAttachments] = useState<FileUploadProgress[]>([])
  const accept = 'image/*,video/*,audio/*'
  const fileInputRef = useRef<HTMLInputElement>(null)

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
              a.id === attachment.id ? { ...a, status: 'complete' } : a,
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
    if (!user) return

    try {
      const completedAttachments = attachments
        .filter(a => a.status === 'complete')
        .map(a => (a.file as File & { fileUrl: string }).fileUrl)

      await axios.post(`/api/sessions/${sessionId}/messages`, {
        session_id: sessionId,
        content: data.content,
        attachments: completedAttachments,
      })

      form.reset()
      setAttachments([])
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      {isDragging && (
        <AttachmentDropzone isDragging={isDragging} accept={accept} />
      )}
      <div className="sticky pb-6 bottom-0 z-[51] bg-aui-background w-[calc(100%-2rem)] md:w-full mx-auto">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="sticky bottom-6 z-[51] border border-aui-border bg-accent-foreground/5 rounded-md items-start p-2.5 focus-within:border-aui-ring/20 transition-all duration-300"
          >
            {attachments.length > 0 && (
              <LightboxGallery>
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map(attachment => (
                    <div
                      key={attachment.id}
                      className="relative rounded-md border border-secondary cursor-pointer hover:bg-accent"
                    >
                      {attachment.status === 'uploading' && (
                        <div className="absolute inset-0 flex flex-col justify-center rounded-md bg-background/70 w-full h-full overflow-hidden">
                          <LoadingIndicator className="absolute w-10 h-10 text-purple-600 self-center" />
                          <Progress
                            max={100}
                            value={Math.round(attachment.progress * 100)}
                            className="h-1 rounded-none mt-auto"
                          />
                        </div>
                      )}
                      <div className="p-1 flex gap-1 h-full">
                        <div className="w-16 h-16 text-xs flex items-center justify-center text-muted-foreground">
                          {attachment.file.name
                            .split('.')
                            .pop()
                            ?.toUpperCase() || '?'}
                        </div>
                      </div>
                    </div>
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
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <PaperclipIcon className="w-4 h-4" />
              </Button>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <AutosizeTextarea
                        {...field}
                        placeholder="Write a message..."
                        className="focus-visible:ring-0 border-none bg-transparent rounded-none focus-visible:ring-offset-0 py-1"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            form.handleSubmit(onSubmit)()
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8"
                disabled={
                  !form.formState.isValid ||
                  attachments.some(a => a.status === 'uploading')
                }
              >
                <SendIcon className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  )
}
