import TaskParameterTable from '@/components/timeline/task-parameter-table'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { downloadFile, getDownloadFileName } from '@/lib/files'
import { GeneratorOutputTypeV2, TaskV2 } from '@edenlabs/eden-sdk'
import { DownloadIcon, ListIcon } from 'lucide-react'
import React from 'react'

type Props = {
  downloadUri: string
  fileName: string
  task: TaskV2
  outputType: GeneratorOutputTypeV2
}
const TimelineItemResultTools = ({
  task,
  downloadUri,
  fileName,
  outputType,
}: Props) => {
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
            title={`Download ${outputType}`}
            className="h-9 w-9 p-0"
            onClick={() =>
              downloadFile(
                downloadUri,
                getDownloadFileName(task.user, task._id, fileName),
              )
            }
          >
            <DownloadIcon size={20} />
          </Button>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              title="Show task configuration"
              className="h-9 w-9 p-0"
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
