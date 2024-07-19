import { Button } from '@/components/ui/button'
import { downloadFile, getDownloadFileName } from '@/lib/files'
import { TaskV2 } from '@edenlabs/eden-sdk'
import { DownloadIcon } from 'lucide-react'
import React from 'react'

type Props = {
  downloadUri: string
  fileName: string
  task: TaskV2
}
const TimelineItemResultTools = ({ task, downloadUri, fileName }: Props) => {
  return (
    <div
      data-test-id="timeline-item-result-tools"
      className="relative flex flex-wrap gap-2 text-sm py-2 px-2 rounded-b-lg bg-muted/60"
    >
      <Button
        variant="outline"
        size="sm"
        title="Download"
        className="h-9 w-9 p-0"
        onClick={() =>
          downloadFile(
            downloadUri,
            getDownloadFileName(task.user, task._id, fileName),
          )
        }
      >
        <DownloadIcon size={16} />
      </Button>
    </div>
  )
}

export default TimelineItemResultTools
