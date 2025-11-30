'use client'

import { SubscriptionCrownBadge } from '@/components/badge/subscription-crown-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import UserAvatar from '@/components/user/user-avatar'
import UserAvatarLink from '@/components/user/user-avatar-link'
import CreationsFeed from '@/features/feed/creations-feed'
import { MarkdownText } from '@/features/sessions/components/markdown-text'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  GatedActions,
  useSubscriptionGate,
} from '@/hooks/use-subscription-gate'
import {
  updateDeleteDialog,
  updateShareModal,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { ArtifactV2, Creator } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import {
  Edit2Icon,
  LockIcon,
  LockOpenIcon,
  Share2Icon,
  TrashIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type Props = {
  id: string
  artifactSSRData?: ArtifactV2
}

const updateArtifactSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  public: z.boolean().optional(),
})

type UpdateArtifactDto = z.infer<typeof updateArtifactSchema>

const ArtifactDetail = ({ id, artifactSSRData }: Props) => {
  const router = useRouter()
  const { user } = useAuthState()
  const dispatch = useAppDispatch()
  const { isAllowed: isAllowedPrivacy } = useSubscriptionGate(
    GatedActions.MakePrivate,
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [artifact, setArtifact] = useState<ArtifactV2 | undefined>(
    artifactSSRData,
  )

  const updateArtifactForm = useForm<UpdateArtifactDto>({
    resolver: zodResolver(updateArtifactSchema),
    defaultValues: {
      title: artifact?.title || '',
      description: artifact?.description || '',
      type: artifact?.type || '',
      public: artifact?.public || false,
    },
  })

  useEffect(() => {
    if (!artifact) {
      return
    }

    updateArtifactForm.reset({
      title: artifact.title,
      description: artifact.description,
      type: artifact.type,
      public: artifact.public,
    })
  }, [artifact, updateArtifactForm])

  const onUpdateArtifact = async (data: UpdateArtifactDto) => {
    try {
      const response = await axios.patch(`/api/artifacts/${id}`, data)
      setArtifact(response.data.artifact)
      setIsDialogOpen(false)
      toast.success('Artifact updated', {
        description: `Artifact: ${data.title} updated successfully`,
        dismissible: true,
        richColors: true,
      })
    } catch (error) {
      toast.error('Failed to update artifact', {
        description: `Artifact: ${artifact?.title} failed to update`,
        dismissible: true,
        richColors: true,
      })
    }
  }

  const onDeleteArtifact = async () => {
    const handleDelete = async () => {
      try {
        await axios.delete(`/api/artifacts/${id}`)
        toast.success('Artifact deleted', {
          description: `Artifact: ${artifact?.title} deleted successfully`,
          dismissible: true,
          richColors: true,
        })
        router.push(`/creators/${user?.username}`)
      } catch (error) {
        toast.error('Failed to delete artifact', {
          description: `Artifact: ${artifact?.title} failed to delete`,
          dismissible: true,
          richColors: true,
        })
      }
    }

    dispatch(
      updateDeleteDialog({
        isOpen: true,
        title: 'Delete Artifact',
        description: 'Are you sure you want to delete this artifact?',
        onDelete: handleDelete,
      }),
    )
  }

  const onShareArtifact = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/artifacts/${id}`
    dispatch(
      updateShareModal({
        isOpen: true,
        shareUrl,
      }),
    )
  }

  return (
    <>
      <div className="relative p-6 bg-muted-darker rounded-md mx-4 mt-4">
        <div className="flex gap-2 flex-wrap w-full">
          <div className="mr-auto">
            <h1 className="text-2xl font-semibold flex gap-2 items-center">
              {artifact?.title}
              {!artifact?.public ? <LockIcon size={18} /> : null}
            </h1>
            <div className="text-sm text-muted-foreground mt-1">
              Type: <span className="font-medium">{artifact?.type}</span>
            </div>
          </div>

          <div className="flex gap-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onShareArtifact}
              title="Share Artifact"
            >
              <Share2Icon size={18} />
            </Button>
            {user?._id === artifact?.user?._id && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Edit2Icon size={18} />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={onDeleteArtifact}
                >
                  <TrashIcon size={18} />
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-x-2 mt-2 text-sm text-gray-300">
          Created by{' '}
          <span>
            <UserAvatarLink
              name={artifact?.user?.username || artifact?.user?._id}
              image={artifact?.user?.userImage}
            />
          </span>
        </div>
        {artifact?.agents && artifact.agents.length > 0 && (
          <div className="flex items-center gap-x-2 mt-3 text-sm text-gray-300">
            <span className="text-muted-foreground">Agents:</span>
            <div className="flex items-center gap-x-3 flex-wrap">
              {artifact.agents.map((agent: Creator) => (
                <Link
                  key={agent._id}
                  href={`/agents/${agent.username || agent._id}`}
                  className="group flex gap-2 items-center cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <UserAvatar
                    image={agent.userImage}
                    name={agent.username || agent._id}
                    className="h-6 w-6"
                  />
                  <span className="group-hover:text-primary transition-colors">
                    {agent.username || agent._id}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm mt-2 text-gray-300">
          {artifact?.creations?.length || 0} creations
        </p>
      </div>
      {artifact?.description && (
        <div className="mx-4 mt-4 p-6 bg-muted-darker rounded-md">
          <h2 className="text-lg font-semibold mb-3">Description</h2>
          <div className="prose prose-invert prose-sm max-w-none">
            <MarkdownText>{artifact.description}</MarkdownText>
          </div>
        </div>
      )}
      <div className="p-4">
        <CreationsFeed
          query={{ artifact: id }}
          maxCols={7}
          multiselect={user?._id === artifact?.user?._id}
        />
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogTitle>Edit Artifact</DialogTitle>
          <DialogDescription>
            Change the title, description, type and privacy settings of an
            artifact
          </DialogDescription>
          <Form {...updateArtifactForm}>
            <form
              onSubmit={updateArtifactForm.handleSubmit(onUpdateArtifact)}
              className="space-y-4"
            >
              <FormField
                control={updateArtifactForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Artifact Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateArtifactForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. seed, plant, screenplay"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateArtifactForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Artifact Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateArtifactForm.control}
                name="public"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-y-2">
                    <FormLabel>Privacy</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-x-2 relative w-fit">
                        <SubscriptionCrownBadge
                          type="collection"
                          className="h-5 w-5"
                        />
                        <Switch
                          className="!mt-0"
                          disabled={!isAllowedPrivacy}
                          checked={field.value}
                          onCheckedChange={checked => {
                            field.onChange(checked)
                          }}
                        />
                        <LockOpenIcon size={16} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button disabled={updateArtifactForm.formState.isSubmitting}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ArtifactDetail
