'use client'

import ShareDialog from '@/components/dialog/share-dialog'
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
import UserAvatarLink from '@/components/user/user-avatar-link'
import CreationsFeed from '@/features/feed/creations-feed'
import { useCollectionQuery } from '@/hooks/query/use-collection-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { toggleShareDialog } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { CollectionV2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import {
  Edit2Icon,
  LockIcon,
  LockOpenIcon,
  Share2Icon,
  TrashIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type Props = {
  id: string
  collectionSSRData?: CollectionV2
}

const updateCollectionSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  public: z.boolean().optional(),
})

type UpdateCollectionDto = z.infer<typeof updateCollectionSchema>

const CollectionDetail = ({ id, collectionSSRData }: Props) => {
  const router = useRouter()
  const { user } = useAuthState()
  const dispatch = useAppDispatch()

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { collection: collectionClientData, invalidate } = useCollectionQuery({
    key: id,
    initialData: collectionSSRData
      ? {
          collection: collectionSSRData,
        }
      : undefined,
  })

  const collection = collectionClientData || collectionSSRData

  const updateCollectionForm = useForm<UpdateCollectionDto>({
    resolver: zodResolver(updateCollectionSchema),
    defaultValues: {
      name: collection?.name || '',
      description: collection?.description || '',
      public: collection?.public || false,
    },
  })

  useEffect(() => {
    if (!collection) {
      return
    }

    updateCollectionForm.reset({
      name: collection.name,
      description: collection.description,
      public: collection.public,
    })
  }, [collection, updateCollectionForm])

  const onUpdateCollection = async (data: UpdateCollectionDto) => {
    try {
      await axios.patch(`/api/collections/${id}`, data)
      setIsDialogOpen(false)
      toast.success('Collection updated', {
        description: `Collection: ${data.name} updated successfully`,
        dismissible: true,
        richColors: true,
      })
      invalidate()
    } catch (error) {
      toast.error('Failed to update collection', {
        description: `Collection: ${collection?.name} failed to update`,
        dismissible: true,
        richColors: true,
      })
    }
  }

  const onDeleteCollection = async () => {
    try {
      await axios.delete(`/api/collections/${id}`)
      toast.success('Collection deleted', {
        description: `Collection: ${collection?.name} deleted successfully`,
        dismissible: true,
        richColors: true,
      })
      router.push(`/creators/${user?.username}?tab=collections`)
    } catch (error) {
      toast.error('Failed to delete collection', {
        description: `Collection: ${collection?.name} failed to delete`,
        dismissible: true,
        richColors: true,
      })
    }
  }

  const onShareCollection = () => {
    dispatch(toggleShareDialog())
  }

  return (
    <>
      <div className="relative p-6 bg-muted-darker rounded-md mx-4 mt-4">
        {user?._id === collection?.user._id && (
          <div className="absolute right-6 flex gap-x-2">
            <Button variant="outline" size="icon" onClick={onShareCollection}>
              <Share2Icon size={18} />
            </Button>
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
              onClick={onDeleteCollection}
            >
              <TrashIcon size={18} />
            </Button>
          </div>
        )}
        <h1 className="text-2xl font-semibold">{collection?.name}</h1>
        <p className="text-sm mt-2 text-gray-200">{collection?.description}</p>
        <div className="flex items-center gap-x-2 mt-2 text-sm text-gray-300">
          Curated by{' '}
          <span>
            <UserAvatarLink
              name={collection?.user.username || collection?.user._id}
              image={collection?.user.userImage}
            />
          </span>
        </div>
        <p className="text-sm mt-2 text-gray-300">
          {collection?.creations.length} creations
        </p>
      </div>
      <div className="p-4">
        <CreationsFeed
          query={{ collection: collection?._id }}
          maxCols={7}
          multiselect={user?._id === collection?.user._id}
        />
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogTitle>Edit Collection</DialogTitle>
          <DialogDescription>
            Change the name, description and privacy settings of a collection
          </DialogDescription>
          <Form {...updateCollectionForm}>
            <form
              onSubmit={updateCollectionForm.handleSubmit(onUpdateCollection)}
              className="space-y-4"
            >
              <FormField
                control={updateCollectionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Collection Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateCollectionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Collection Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateCollectionForm.control}
                name="public"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-y-2">
                    <FormLabel>Privacy</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-x-4">
                        <LockIcon size={16} />
                        <Switch
                          className="!mt-0"
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
                <Button disabled={updateCollectionForm.formState.isSubmitting}>
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

export default CollectionDetail
