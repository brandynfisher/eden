'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CollectionV2 } from '@edenlabs/eden-sdk'
import { PlusIcon } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (value: boolean) => void
}

const CollectionSelectionDialog = ({ open, onOpenChange }: Props) => {
  const userCollections: CollectionV2[] = []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Add to collection</DialogTitle>
        <DialogDescription>
          Select a collection to add the selected items to. Duplicates will be
          skipped.
        </DialogDescription>
        {userCollections.length > 0 ? (
          <ScrollArea className="max-h-72 py-4">
            {userCollections.map(collection => (
              <>
                <div key={collection._id} className="flex items-center gap-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    // onClick={() =>
                    //   onCollectionSelect(collection._id, collection.name)
                    // }
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
  )
}

export default CollectionSelectionDialog
