'use client'

import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import UserAvatarLink from '@/components/user/user-avatar-link'
import UpdateAssistantSheet from '@/features/assistant/update-assistant-sheet'
import { useAssistantQuery } from '@/hooks/query/use-assistant-query'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  updateDeleteDialog,
  updateShareModal,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Agent } from '@edenlabs/eden-sdk'
import { AvatarFallback } from '@radix-ui/react-avatar'
import axios from 'axios'
import { Share2Icon, TrashIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Props = {
  id: string
  assistantSSRData?: Agent
}

const AssistantDetail = ({ id, assistantSSRData }: Props) => {
  const router = useRouter()
  const { user } = useAuthState()
  const dispatch = useAppDispatch()

  const { assistant: assistantClientData, invalidate } = useAssistantQuery({
    key: id,
    initialData: assistantSSRData
      ? {
          assistant: assistantSSRData,
        }
      : undefined,
  })

  const assistant = assistantClientData || assistantSSRData

  const onDeleteAssistant = async () => {
    const handleDelete = async () => {
      try {
        await axios.delete(`/api/assistants/${id}`)
        toast.success('Assistant deleted', {
          description: `Assistant: ${assistant?.name} deleted successfully`,
          dismissible: true,
          richColors: true,
        })
        router.push(`/creators/${user?.username}?tab=assistants`)
      } catch (error) {
        toast.error('Failed to delete assistant', {
          description: `Assistant: ${assistant?.name} failed to delete`,
          dismissible: true,
          richColors: true,
        })
      }
    }

    dispatch(
      updateDeleteDialog({
        isOpen: true,
        title: 'Delete Assistant',
        description: 'Are you sure you want to delete this assistant?',
        onDelete: handleDelete,
      }),
    )
  }

  const onUpdateAssistant = () => {
    invalidate()
  }

  const onShareAssistant = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/assistants/${assistant?._id}`
    dispatch(
      updateShareModal({
        isOpen: true,
        shareUrl,
      }),
    )
  }

  if (!assistant) return null

  return (
    <>
      <div className="relative p-6 bg-muted-darker rounded-md mx-4 mt-4">
        {user?._id === assistant?.user._id && (
          <div className="absolute right-6 flex gap-x-2">
            <Button variant="outline" size="icon" onClick={onShareAssistant}>
              <Share2Icon size={18} />
            </Button>
            <UpdateAssistantSheet
              assistant={assistant}
              onUpdate={onUpdateAssistant}
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={onDeleteAssistant}
            >
              <TrashIcon size={18} />
            </Button>
          </div>
        )}
        {assistant.image && (
          <div className="mb-4">
            <Avatar className="size-20">
              <AvatarImage src={assistant.image} />
              <AvatarFallback>{assistant.name[0]}</AvatarFallback>
            </Avatar>
          </div>
        )}
        <h1 className="text-2xl font-semibold">{assistant?.name}</h1>
        <p className="text-sm mt-2 text-gray-200">{assistant?.description}</p>
        <div className="flex items-center gap-x-2 mt-2 text-sm text-gray-300">
          by{' '}
          <span>
            <UserAvatarLink
              name={assistant.user.username || assistant.user._id}
              image={assistant.user.userImage}
            />
          </span>
        </div>
      </div>
    </>
  )
}

export default AssistantDetail
