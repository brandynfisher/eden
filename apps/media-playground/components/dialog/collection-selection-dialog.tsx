'use client'

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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useCollectionsLight } from '@/hooks/query/use-collections-light'
import {
  useAddToCollectionModalOpen,
  useCreateCollectionModalOpen,
} from '@/stores/dialogs/dialogs.selector'
import {
  toggleAddToCollectionModal,
  toggleCreateCollectionModal,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { PlusIcon } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const createCollectionSchema = z.object({
  name: z.string().optional(),
})

type CreateCollectionDto = z.infer<typeof createCollectionSchema>

interface CollectionSelectionDialogProps {
  creations: CreationV2[]
}

const CollectionSelectionDialog = ({
  creations,
}: CollectionSelectionDialogProps) => {
  const dispatch = useAppDispatch()
  const isAddToCollectionModalOpen = useAddToCollectionModalOpen()
  const isCreateCollectionModalOpen = useCreateCollectionModalOpen()
  const [isAddingToCollection, setIsAddingToCollection] = React.useState(false)

  const { collections, refetch } = useCollectionsLight()

  const handleAddToCollectionModalOpenChange = React.useCallback(() => {
    dispatch(toggleAddToCollectionModal())
  }, [dispatch])

  const handleCreateCollectionModalOpenChange = React.useCallback(() => {
    dispatch(toggleCreateCollectionModal())
  }, [dispatch])

  const createCollectionForm = useForm<CreateCollectionDto>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: {
      name: '',
    },
  })

  const onCreateCollection = async (data: CreateCollectionDto) => {
    try {
      await axios.post(`/api/collections`, data)
      refetch()
      toast.success('Collection create', {
        description: `Collection: ${data.name} created successfully`,
        dismissible: true,
        richColors: true,
      })
      handleCreateCollectionModalOpenChange()
    } catch (error) {
      toast.error('Failed to create collection', {
        description: `Collection: ${data.name} failed to create`,
        dismissible: true,
        richColors: true,
      })
    }
  }

  const onAddToCollection = async (collectionId: string) => {
    setIsAddingToCollection(true)
    try {
      await axios.patch(`/api/collections/${collectionId}/add-creations`, {
        creationIds: creations.map(creation => creation._id),
      })
      toast.success('Creations added to collection', {
        description: `Creations added to collection successfully`,
        dismissible: true,
        richColors: true,
      })
    } catch (error) {
      toast.error('Failed to add creations to collection', {
        description: `Failed to add creations to collection`,
        dismissible: true,
        richColors: true,
      })
    }
    setIsAddingToCollection(false)
  }

  if (!collections) {
    return null
  }

  return (
    <>
      <Dialog
        open={isAddToCollectionModalOpen}
        onOpenChange={handleAddToCollectionModalOpenChange}
      >
        <DialogContent>
          <DialogTitle>Add to collection</DialogTitle>
          <DialogDescription>
            Select a collection to add the selected items to. Duplicates will be
            skipped.
          </DialogDescription>
          {collections.length > 0 ? (
            <>
              <ScrollArea className="max-h-72 py-4">
                {collections.map(collection => (
                  <div
                    key={collection._id}
                    className="flex items-center gap-x-2 my-2"
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="!size-8"
                      onClick={() => onAddToCollection(collection._id)}
                      disabled={isAddingToCollection}
                    >
                      <PlusIcon size={16} />
                    </Button>
                    <p className="font-semibold">{collection.name}</p>
                  </div>
                ))}
              </ScrollArea>
              <Separator className="my-2" />
              <Button
                variant="outline"
                size="lg"
                className="!w-full"
                onClick={handleCreateCollectionModalOpenChange}
              >
                Create new collection
              </Button>
            </>
          ) : (
            <p>No collections found</p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={isCreateCollectionModalOpen}
        onOpenChange={handleCreateCollectionModalOpenChange}
      >
        <DialogContent>
          <DialogTitle>Create collection</DialogTitle>
          <DialogDescription>
            Create a new collection to add the selected items to.
          </DialogDescription>
          <Form {...createCollectionForm}>
            <form
              onSubmit={createCollectionForm.handleSubmit(onCreateCollection)}
              className="space-y-4"
            >
              <FormField
                control={createCollectionForm.control}
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
              <DialogFooter>
                <Button disabled={createCollectionForm.formState.isSubmitting}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CollectionSelectionDialog
