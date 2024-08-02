import LoadingIndicator from '@/components/loading-indicator'
import TaskParameterTable from '@/components/timeline/task-parameter-table'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { downloadFile, getDownloadFileName } from '@/lib/files'
import { GeneratorOutputTypeV2, TaskV2 } from '@edenlabs/eden-sdk'
import axios, { AxiosError } from 'axios'
import {
  BookHeartIcon,
  ClipboardCopy,
  DownloadIcon,
  ListIcon,
} from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

type Props = {
  originalFileUrl: string
  fileName: string
  task: TaskV2
  outputType: GeneratorOutputTypeV2
}

const TimelineItemResultTools = ({
  task,
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
      const response = await axios.post(`/api/tasks/publish`, {
        taskId,
        resultUrl: originalFileUrl,
      })

      const responseData = response.data

      console.log({ responseData })

      toast.success(`Published result`, {
        id: publishToast,
        description: 'Creation added to your profile',
        action: {
          label: 'Show',
          // @todo: show detail page (and dismiss this toast as the default onClick here does)
          onClick: () => console.log('Action!'),
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
            variant="outline"
            size="sm"
            title={`Publish creation to profile`}
            className="px-2 flex gap-2 items-center justify-center"
            onClick={() => publishTaskResult(task._id, originalFileUrl)}
          >
            <BookHeartIcon size={20} />
            Publish
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
