'use client'

import CreationsBulkActionsMenu from '@/components/button/creations-bulk-actions-menu'
import LoadingIndicator from '@/components/loading-indicator'
import { Button } from '@/components/ui/button'
import { useMultiSelection } from '@/contexts/multi-select-context'
import { DownloadFile, downloadFiles } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { DownloadIcon, XIcon } from 'lucide-react'
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
            creations={selectedItems}
          />

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
