'use client'

import { Button } from '@/components/ui/button'
import { useMultiSelection } from '@/contexts/multi-select-context'
import { DownloadIcon, LucideListPlus, Trash2Icon, XIcon } from 'lucide-react'
import React from 'react'

const MultiSelectToolbar: React.FC = () => {
  const { selectedItems, clearSelection } = useMultiSelection()

  if (selectedItems.length === 0) {
    return null
  }

  const handleDelete = () => {
    // Implement delete functionality
    console.log('Delete items:', selectedItems)
    clearSelection()
  }

  const handleDownload = () => {
    // Implement download functionality
    console.log('Download items:', selectedItems)
    // Example: Trigger download for each selected item
  }

  const handleAddToCollection = () => {
    // Implement download functionality
    console.log('Add items to colleciton:', selectedItems)
    // Example: Trigger download for each selected item
  }

  return (
    <div className="flex justify-center">
      <div className="fixed rounded-lg bottom-4 md:w-full max-w-md bg-muted bg-opacity-85 backdrop-blur-[2px] flex items-center px-3 py-3 drop-shadow-lg gap-4">
        <Button
          onClick={clearSelection}
          className="flex items-center"
          title="Clear selection"
        >
          <XIcon className="h-5 w-5" />
          <span className="sr-only">Clear Selection</span>
        </Button>
        <span className="text-accent-foreground">
          {selectedItems.length} selected
        </span>
        <div className="flex space-x-2 ml-auto">
          <Button
            variant="outline"
            onClick={handleAddToCollection}
            className="flex items-center"
            title="Add items to Collection"
          >
            <LucideListPlus className="h-5 w-5" />
            <span className="sr-only">Add to collection</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex items-center"
            title="Download items"
          >
            <DownloadIcon className="h-5 w-5" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex items-center text-destructive border border-destructive"
            title="Delete items"
          >
            <Trash2Icon className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MultiSelectToolbar
