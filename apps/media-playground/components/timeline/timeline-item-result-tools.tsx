import LoadingIndicator from '@/components/loading-indicator'
import TaskParameterTable from '@/components/timeline/task-parameter-table'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { downloadFile, getDownloadFileName } from '@/lib/files'
import {
  GeneratorOutputTypeV2,
  TaskV2,
  TaskV2Result,
  TasksV2PublishResponse,
} from '@edenlabs/eden-sdk'
import axios, { AxiosError, AxiosResponse } from 'axios'
import {
  BookCheckIcon,
  BookHeartIcon,
  ClipboardCopy,
  DownloadIcon,
  ListIcon,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { toast } from 'sonner'

type Props = {
  originalFileUrl: string
  fileName: string
  task: TaskV2
  result: TaskV2Result
  outputType: GeneratorOutputTypeV2
}

const TimelineItemResultTools = ({
  task,
  result,
  originalFileUrl,
  fileName,
  outputType,
}: Props) => {
  const publishTaskResult = async (taskId: string, originalFileUrl: string) => {
    console.log('publishTaskResult', taskId, originalFileUrl)

    const publishToast = toast(
      <div className="flex gap-2 items-center justify-center">
        <LoadingIndicator className="h-6" />
        Publishing creation...
      </div>,
      { dismissible: true },
    )

    try {
      const response: AxiosResponse<TasksV2PublishResponse> = await axios.post(
        `/api/tasks/publish`,
        {
          taskId,
          resultUrl: originalFileUrl,
        },
      )

      const responseData = response.data

      console.log({ responseData })

      toast.success(`Published`, {
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
      toast.error(`Failed to publish`, {
        id: publishToast,
        description: JSON.stringify(
          (e as AxiosError<{ message: string }>)?.response?.data?.message,
        ),
        dismissible: true,
        richColors: true,
      })
    }
  }

  return (
    <div
      data-test-id="timeline-item-result-tools"
      className="relative text-sm py-2 px-2 rounded-b-lg bg-muted/60"
    >
      <Collapsible>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={result.published ? 'ghost' : 'outline'}
            size="sm"
            title={
              result.published
                ? 'Creation was published'
                : `Publish creation to profile`
            }
            className={`px-2 flex gap-2 items-center justify-center ${result.published ? 'cursor-default' : ''}`}
            onClick={
              result.published
                ? undefined
                : () => publishTaskResult(task._id, originalFileUrl)
            }
          >
            {result.published ? (
              <>
                <BookCheckIcon size={20} className="text-success" />
                Published
              </>
            ) : (
              <>
                <BookHeartIcon size={20} />
                Publish
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            title={`Download ${outputType}`}
            className="px-2"
            onClick={() =>
              downloadFile(
                originalFileUrl,
                getDownloadFileName(task.user, task._id, fileName),
              )
            }
          >
            <DownloadIcon size={20} />
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
              className="px-2 ml-auto"
            >
              <ListIcon size={20} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <TaskParameterTable task={task} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default TimelineItemResultTools
