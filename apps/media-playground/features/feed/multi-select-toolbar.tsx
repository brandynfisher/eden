'use client'

import { Button } from '@/components/ui/button'
import { useMultiSelection } from '@/contexts/multi-select-context'
import { DownloadIcon, Trash2Icon, XIcon } from 'lucide-react'
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

  return (
    <div className="flex justify-center">
      <div className="fixed rounded-lg bottom-4 md:w-full max-w-md bg-accent bg-opacity-90 backdrop-blur-[2px] flex items-center p-4 drop-shadow-lg gap-4">
        <Button onClick={clearSelection} className="flex items-center">
          <XIcon className="h-5 w-5" />
          <span className="sr-only">Clear Selection</span>
        </Button>
        <span className="text-white">{selectedItems.length} selected</span>
        <div className="flex space-x-2 ml-auto">
          <Button
            variant="secondary"
            onClick={handleDownload}
            className="flex items-center"
          >
            <DownloadIcon className="h-5 w-5" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center"
          >
            <Trash2Icon className="h-5 w-5" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MultiSelectToolbar
