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
import { Message } from '@edenlabs/eden-sdk'
import { Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface SessionShareButtonProps {
  sessionId: string
  messages: Message[]
  isOwner: boolean
  className?: string
}

export const SessionShareButton = ({
  sessionId,
  messages,
  isOwner,
  className,
}: SessionShareButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [shareId, setShareId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

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
      console.log('Share response:', data)

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
          <span className="ml-2 text-sm">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Share session</DialogTitle>
          <DialogDescription>
            Create a public link to share this conversation up to the current
            point. Any messages you add after sharing stay private.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!shareId ? (
            <div className="space-y-4">
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
              <div className="text-sm text-muted-foreground">
                This will share {messages.length} message
                {messages.length !== 1 ? 's' : ''} up to the current point.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
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
              <div className="text-sm text-muted-foreground">
                Anyone with this link will be able to view the shared
                conversation.
              </div>
            </div>
          )}
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
