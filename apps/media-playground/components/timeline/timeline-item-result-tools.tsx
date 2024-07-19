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
    <>
      <Button
        variant="outline"
        size="sm"
        title="Download"
        onClick={() =>
          downloadFile(
            downloadUri,
            getDownloadFileName(task.user, task._id, fileName),
          )
        }
      >
        <DownloadIcon size={20} />
      </Button>
    </>
  )
}

export default TimelineItemResultTools
