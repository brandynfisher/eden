'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Message } from '@edenlabs/eden-sdk'
import { Copy, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SessionShareButtonProps {
  sessionId: string
  messages: Message[]
  isOwner: boolean
  isPublic?: boolean
  className?: string
  hideText?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SessionShareButton = ({
  sessionId,
  messages,
  isOwner,
  isPublic = false,
  className,
  hideText = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SessionShareButtonProps) => {
  const [internalOpen, setInternalOpen] = useState(false)

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen =
    controlledOnOpenChange !== undefined
      ? controlledOnOpenChange
      : setInternalOpen
  const [shareId, setShareId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isPublicSession, setIsPublicSession] = useState(isPublic)
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false)

  // Update local state when prop changes
  useEffect(() => {
    setIsPublicSession(isPublic)
  }, [isPublic])

  // Don't render if not the session owner
  if (!isOwner) {
    return null
  }

  const lastMessage = messages[messages.length - 1]

  const createShare = async () => {
    if (!lastMessage) {
      toast.error('No messages to share')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch(`/api/v2/sessions/${sessionId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          message_id: lastMessage._id,
          title: title.trim() || undefined,
        }),
      })

      if (!response.ok) {
        let errorMessage = `Failed to create share (${response.status})`
        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          // If JSON parsing fails, try to get text content
          try {
            const errorText = await response.text()
            console.error(
              'Non-JSON error response:',
              errorText.substring(0, 200),
            )
            errorMessage = `Server returned ${response.status}: ${response.statusText}`
          } catch {
            console.error('Could not read error response')
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.share_id) {
        throw new Error('No share ID returned from server')
      }

      setShareId(data.share_id)

      // Automatically copy to clipboard like ChatGPT
      const shareUrl = `${window.location.origin}/sessions/share/${data.share_id}`
      await navigator.clipboard.writeText(shareUrl)

      toast.success('Share link created and copied to clipboard!')
    } catch (error) {
      console.error('Error creating share:', error)
      if (error instanceof Error) {
        toast.error(`Failed to create share: ${error.message}`)
      } else {
        toast.error('Failed to create share. Please try again.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const copyShareLink = async () => {
    if (!shareId) return

    try {
      const shareUrl = `${window.location.origin}/sessions/share/${shareId}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy link')
    }
  }

  const togglePublicSession = async (checked: boolean) => {
    setIsUpdatingPublic(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          extras: {
            is_public: checked,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update session visibility')
      }

      setIsPublicSession(checked)
      toast.success(
        checked
          ? 'Session is now public - all messages (including future ones) are visible to anyone with the link'
          : 'Session is now private',
      )
    } catch (error) {
      console.error('Error updating session visibility:', error)
      toast.error('Failed to update session visibility')
      // Revert the toggle on error
      setIsPublicSession(!checked)
    } finally {
      setIsUpdatingPublic(false)
    }
  }

  const resetDialog = () => {
    setShareId(null)
    setTitle('')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
          onClick={() => setIsOpen(true)}
        >
          <Share2 className="h-4 w-4" />
          {!hideText && <span className="ml-2 text-sm">Share</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Share session</DialogTitle>
          <DialogDescription>
            Share a snapshot of this conversation up to now, or make the entire
            session public for all messages.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {!shareId && (
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="Add a title for your shared conversation"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>
          )}

          {shareId && (
            <div className="space-y-2">
              <Label>Share link</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border min-w-0">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-sm font-mono text-foreground truncate">
                    {`${window.location.host}/sessions/share/${shareId}`}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyShareLink}
                  className="flex-shrink-0 gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="public-toggle" className="text-base">
                Make Entire Session Public
              </Label>
              <div className="text-sm text-muted-foreground">
                Anyone can see all messages, including future ones
              </div>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublicSession}
              onCheckedChange={togglePublicSession}
              disabled={isUpdatingPublic}
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
            {isPublicSession ? (
              <>
                This session is now public. Anyone with the link can view all
                messages, including any new messages you send.
              </>
            ) : (
              <>
                This will create a permanent snapshot of {messages.length}{' '}
                message
                {messages.length !== 1 ? 's' : ''}. The snapshot won't update
                with new messages.
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          {!shareId ? (
            <>
              <Button variant="outline" onClick={resetDialog}>
                Cancel
              </Button>
              <Button onClick={createShare} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create share link'}
              </Button>
            </>
          ) : (
            <Button onClick={resetDialog} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
