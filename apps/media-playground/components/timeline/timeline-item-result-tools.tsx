import LoadingIndicator from '@/components/loading-indicator'
import ParameterTable from '@/components/timeline/parameter-table'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { downloadFile, getDownloadFileName } from '@/lib/files'
import { cn } from '@/lib/utils'
import {
  TaskV2,
  TaskV2Result,
  TasksV2PublishResponse,
} from '@edenlabs/eden-sdk'
import axios, { AxiosError, AxiosResponse } from 'axios'
import {
  BookCheckIcon,
  BookHeartIcon,
  ClipboardCopy,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ListIcon,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  originalFilename: string
  fileName: string
  task: TaskV2
  result: TaskV2Result
  outputType: 'creation' | 'model'
  className?: string
}

const TimelineItemResultTools = ({
  task,
  result,
  originalFilename,
  fileName,
  outputType,
  className,
}: Props) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const handleFileDownload = async (
    originalFilename: string,
    downloadFilename: string,
  ) => {
    // console.log({ originalFilename, downloadFilename })

    setIsDownloading(true)
    await downloadFile(originalFilename, downloadFilename)
    setIsDownloading(false)
    toast.info(`Downloading...`, {
      description: downloadFilename,
      dismissible: true,
      richColors: true,
    })
  }

  const [copiedText, copy] = useCopyToClipboard()

  const handleCopyString = (text: string) => () => {
    copy(text)
      .then(() => {
        toast.success(`Copied Model ID`, {
          description: text,
          dismissible: true,
          richColors: true,
        })
        console.log('Copied!', { copiedText })
      })
      .catch(error => {
        toast.error(`Failed to copy!`, {
          description: error,
          dismissible: true,
          richColors: true,
        })
      })
  }

  const [isPublishing, setIsPublishing] = useState(false)
  const publishTaskResult = async (taskId: string, originalFileUrl: string) => {
    setIsPublishing(true)
    const publishToast = toast(
      <div className="flex gap-2 items-center justify-center">
        <LoadingIndicator className="h-6" />
        Saving creation...
      </div>,
      { dismissible: true },
    )

    try {
      const response: AxiosResponse<TasksV2PublishResponse> = await axios.post(
        `/api/tasks/publish`,
        {
          taskId,
          resultFilename: originalFileUrl,
        },
      )

      const responseData = response.data

      // console.log({ responseData })

      toast.success(`Saved`, {
        id: publishToast,
        description: 'Creation was added to your profile',
        action: {
          label: (
            <Link href={`/creations/${responseData?.creation?._id}`}>Show</Link>
          ),
          onClick: () =>
            console.log(`/creations/${responseData?.creation?._id}`),
        },
        dismissible: true,
        richColors: true,
      })
    } catch (e: unknown) {
      toast.error(`Failed to save`, {
        id: publishToast,
        description: JSON.stringify(
          (e as AxiosError<{ message: string }>)?.response?.data?.message,
        ),
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div
      data-test-id="timeline-item-result-tools"
      className={cn([
        `relative text-sm py-2 px-2 rounded-b-lg bg-muted/60`,
        className,
      ])}
    >
      <Collapsible>
        <div className="flex flex-wrap gap-2">
          {outputType === 'model' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="px-2 flex gap-2 items-center justify-center"
                onClick={handleCopyString(result.model || '')}
              >
                <CopyIcon size={20} />
                Copy ID
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="px-2 flex gap-2 items-center justify-center"
              >
                <Link href={`/models/${result?.model}`}>
                  <ExternalLinkIcon className="h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant={result.published ? 'ghost' : 'outline'}
                size="sm"
                title={
                  result.published
                    ? 'Creation was saved'
                    : `Save creation to profile`
                }
                className={`px-2 flex gap-2 items-center justify-center ${
                  result.published ? 'cursor-default' : ''
                }`}
                onClick={
                  result.published
                    ? undefined
                    : () =>
                        publishTaskResult(
                          task._id,
                          result.filename || result.url || '',
                        )
                }
                disabled={isPublishing}
              >
                {result.published ? (
                  <>
                    <BookCheckIcon size={20} className="text-success" />
                  </>
                ) : isPublishing ? (
                  <>
                    <LoadingIndicator className="h-4 w-4" />
                    Saving
                  </>
                ) : (
                  <>
                    <BookHeartIcon size={20} />
                    Save
                  </>
                )}
              </Button>
              {result.published && result.creation ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="px-2 flex gap-2 items-center justify-center"
                >
                  <Link href={`/creations/${result?.creation}`}>
                    <ExternalLinkIcon className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            className="px-2 ml-auto"
            title={`Download ${outputType}`}
            onClick={() =>
              handleFileDownload(
                originalFilename,
                getDownloadFileName(task.user, task._id, fileName),
              )
            }
          >
            {isDownloading ? (
              <LoadingIndicator className="h-5 w-5" />
            ) : (
              <DownloadIcon size={20} />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            title={`Re-Use configuration (${task.workflow})`}
            className="px-2"
            onClick={() =>
              alert('Re-use configuration/Preset - Not implemented')
            }
          >
            <ClipboardCopy size={20} />
          </Button>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              title="Show task configuration"
              className="px-2"
            >
              <ListIcon size={20} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-2">
            <ParameterTable args={task.args} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default TimelineItemResultTools
