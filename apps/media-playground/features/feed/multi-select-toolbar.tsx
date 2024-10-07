'use client'

import CreationsBulkActionsMenu from '@/components/button/creations-bulk-actions-menu'
import LoadingIndicator from '@/components/loading-indicator'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useMultiSelection } from '@/contexts/multi-select-context'
import { DownloadFile, downloadFiles } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { CollectionV2, GeneratorV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import axios from 'axios'
import { DownloadIcon, PlusIcon, XIcon } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

const getSaveAsFileName = (
  id: string,
  tool: GeneratorV2['key'],
  username: string,
  prompt?: string,
) => {
  const formattedPrompt = prompt
    ? `_${prompt.substring(0, 64).trim().replace(/\s+/g, '-')}`
    : ''
  return `Eden_${tool}_${username || ''}${formattedPrompt}_${id}`
}

type Props = {
  queryKey: QueryKey
}

const MultiSelectToolbar = ({ queryKey }: Props) => {
  const [isPreparingDownload, setIsPreparingDownload] = useState(false)
  const { selectedItems, clearSelection } = useMultiSelection()
  const [isAddToCollectionDialogOpen, setIsAddToCollectionDialogOpen] =
    useState(false)
  const [userCollections, setUserCollections] = useState<CollectionV2[]>([])

  if (selectedItems.length === 0) {
    return null
  }

  const handleDownload = async () => {
    // Implement download functionality
    console.log('Download items:', selectedItems)

    setIsPreparingDownload(true)

    const files: DownloadFile[] = selectedItems.map(item => {
      return {
        url: getCloudfrontOriginalUrl(item.url),
        fileName: getSaveAsFileName(
          item._id,
          item.workflow,
          item.user.username || '',
          item.args.prompt,
        ),
      }
    })

    toast.info(`Downloading...`, {
      description: `${files.length} files`,
      dismissible: true,
      richColors: true,
    })
    await downloadFiles(files)

    setIsPreparingDownload(false)
  }

  const onAddToCollectionClick = async () => {
    setIsAddToCollectionDialogOpen(true)
    try {
      const { data } = await axios.get('/api/collections/light')
      setUserCollections(data.collections)
    } catch (error) {
      console.error('Failed to fetch user collections', error)
    }
  }

  const onCollectionSelect = async (collectionId: string, name: string) => {
    const creationIds = selectedItems.map(item => item._id)
    try {
      await axios.patch(`/api/collections/${collectionId}/add`, {
        creationIds,
      })
      toast.success('Added to collection', {
        description: `Selected items added to ${name}`,
        dismissible: true,
        richColors: true,
      })
    } catch (error) {
      toast.error('Failed to add to collection', {
        description: 'An error occurred while adding items to the collection',
        dismissible: true,
        richColors: true,
      })
    }
  }

  return (
    <div className="flex justify-center">
      <div className="fixed rounded-lg bottom-4 md:w-full max-w-md bg-muted bg-opacity-85 backdrop-blur-[2px] flex items-center px-3 py-3 drop-shadow-lg gap-4">
        <span className="text-accent-foreground">
          Selected:{' '}
          <span className="font-mono font-bold">{selectedItems.length}</span>
        </span>
        <div className="flex space-x-2 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={!isPreparingDownload ? handleDownload : undefined}
            className="flex items-center"
            title="Download items"
            disabled={isPreparingDownload}
          >
            {isPreparingDownload ? (
              <LoadingIndicator className="h-5 w-5" />
            ) : (
              <DownloadIcon className="h-5 w-5" />
            )}
            <span className="ml-2 hidden md:block">Download</span>
          </Button>

          <CreationsBulkActionsMenu
            queryKey={queryKey}
            className="w-full h-9 px-3 py-0"
            creations={selectedItems}
            label={<span className="ml-2 hidden md:block">More</span>}
            onAddToCollection={onAddToCollectionClick}
          />

          <Dialog
            open={isAddToCollectionDialogOpen}
            onOpenChange={setIsAddToCollectionDialogOpen}
          >
            <DialogContent>
              <DialogTitle>Add to collection</DialogTitle>
              <DialogDescription>
                Select a collection to add the selected items to. Duplicates
                will be skipped.
              </DialogDescription>
              {userCollections.length > 0 ? (
                <ScrollArea className="max-h-72 py-4">
                  {userCollections.map(collection => (
                    <>
                      <div
                        key={collection._id}
                        className="flex items-center gap-x-2"
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            onCollectionSelect(collection._id, collection.name)
                          }
                        >
                          <PlusIcon size={16} />
                        </Button>
                        {collection.name}
                      </div>
                      <Separator className="my-2" />
                    </>
                  ))}
                </ScrollArea>
              ) : (
                <p>No collections found</p>
              )}
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            className="flex items-center"
            title="Clear selection"
          >
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Clear Selection</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MultiSelectToolbar
