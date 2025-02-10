'use client'

import { LightboxGallery } from '@/components/media/lightbox'
import { Button } from '@/components/ui/button'
import MyAttachment from '@/features/chat/components/attachment'
import { AuthClickGuard } from '@/features/chat/components/auth-click-guard'
import { useEdenRuntimeExtras } from '@/features/chat/hooks/useEdenRuntime'
import { fileMatchesAccept } from '@/features/chat/utils/files'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import {
  Composer,
  ThreadPrimitive,
  useComposerRuntime,
} from '@assistant-ui/react'
import { BotIcon, MessageSquareIcon, PencilOffIcon } from 'lucide-react'
import Link from 'next/link'
import React, { FC, FormEvent, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

type ComposerAttachmentDropzoneProps = {
  isDragging: boolean
  accept: string
}

export const ComposerAttachmentDropzone: FC<
  ComposerAttachmentDropzoneProps
> = ({ isDragging, accept }) => {
  return (
    <div
      className={cn([
        'absolute inset-0 opacity-0 pointer-events-none bg-muted/50 border border-purple-600 rounded-md overflow-hidden',
        isDragging ? 'opacity-100' : '',
      ])}
    >
      {isDragging && (
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
      )}
    </div>
  )
}

type MyComposerProps = {
  setIsDragging: (isDragging: boolean) => void
}

export const MyComposer: FC<MyComposerProps> = ({ setIsDragging }) => {
  const { isSignedIn, verifyAuth } = useAuthState()
  const isReadOnly = useEdenRuntimeExtras(extras => extras.isReadOnly)
  const agentId = useEdenRuntimeExtras(extras => extras.agentId)
  const composerRuntime = useComposerRuntime()
  const accept = composerRuntime.getAttachmentAccept()

  const handleFilesDropped = useCallback(
    async (files: File[]) => {
      const acceptedFiles = files.filter(file =>
        fileMatchesAccept(file, accept),
      )

      if (!acceptedFiles.length) {
        toast.error(`Failed to upload!`, {
          description: `No accepted files in drop. Only type/s '${accept}' allowed here`,
          dismissible: true,
          richColors: true,
        })
        return
      }

      await Promise.all(files.map(file => composerRuntime.addAttachment(file)))
    },
    [accept, composerRuntime],
  )

  useEffect(() => {
    const viewport = document.querySelector(
      '.aui-thread-viewport',
    ) as HTMLElement
    if (!viewport) return

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer?.files || [])
      await handleFilesDropped(files)
    }

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      const rect = viewport.getBoundingClientRect()
      const { clientX, clientY } = e

      // Check if the cursor has left the viewport boundaries
      if (
        clientX <= rect.left ||
        clientX >= rect.right ||
        clientY <= rect.top ||
        clientY >= rect.bottom
      ) {
        setIsDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    viewport.addEventListener('drop', handleDrop)
    viewport.addEventListener('dragenter', handleDragEnter)
    viewport.addEventListener('dragleave', handleDragLeave)
    viewport.addEventListener('dragover', handleDragOver)

    return () => {
      viewport.removeEventListener('drop', handleDrop)
      viewport.removeEventListener('dragenter', handleDragEnter)
      viewport.removeEventListener('dragleave', handleDragLeave)
      viewport.removeEventListener('dragover', handleDragOver)
    }
  }, [accept, handleFilesDropped, setIsDragging])

  if (isReadOnly === null || isReadOnly) {
    return (
      <div className="flex items-center justify-between gap-2 md:gap-3 py-2 px-2 md:px-4 h-[58px] w-full">
        {isReadOnly === true ? (
          <>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 py-2 md:px-4 border border-secondary rounded-lg bg-muted-darker">
              <PencilOffIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm ">
                Read-only view of another user's thread.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link
                href={`/chat/${agentId}`}
                className=" bg-purple-600/20 border-purple-600"
              >
                <MessageSquareIcon className="w-4 h-4 mr-2" />
                <span className="text-sm">Chat with this agent</span>
              </Link>
            </Button>
          </>
        ) : null}
      </div>
    )
  }

  return (
    <Composer.Root
      onSubmit={async (evt: FormEvent<HTMLFormElement>) => {
        if (!isSignedIn) {
          evt.preventDefault()
          await verifyAuth()
          return
        }
      }}
    >
      <LightboxGallery>
        <Composer.Attachments components={{ Attachment: MyAttachment }} />
      </LightboxGallery>

      <AuthClickGuard>
        <Composer.AddAttachment />
      </AuthClickGuard>

      <Composer.Input autoFocus className="text-base" />

      <ThreadPrimitive.If running={true}>
        <div className="flex items-center gap-3">
          <BotIcon className="animate-pulse duration-1000 text-purple-600" />
          {/* <Composer.Cancel /> */}
        </div>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running={false}>
        <AuthClickGuard>
          <Composer.Action />
        </AuthClickGuard>
      </ThreadPrimitive.If>
    </Composer.Root>
  )
}
