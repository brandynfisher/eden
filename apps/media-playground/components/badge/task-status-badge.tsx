import LoadingIndicator from '@/components/loading-indicator'
import { cn } from '@/lib/utils'
import { GeneratorOutputTypeV2, TaskV2Status } from '@edenlabs/eden-sdk'
import { BanIcon, HourglassIcon, TriangleAlertIcon } from 'lucide-react'

type Props = {
  outputType?: GeneratorOutputTypeV2
  status: TaskV2Status
  hideText?: boolean
}
const TaskStatusBadge = ({ outputType, status, hideText }: Props) => {
  return (
    <div className="flex items-center gap-2">
      {status === 'pending' ? <HourglassIcon className="h-4 w-4" /> : null}
      {status === 'running' ? (
        <LoadingIndicator
          className={cn([
            'h-6 w-6 opacity-75',
            outputType === 'video'
              ? 'text-green-400'
              : outputType === 'image'
              ? 'text-purple-600'
              : 'text-blue-600',
          ])}
        />
      ) : null}
      {status === 'cancelled' ? (
        <BanIcon className="h-4 w-4 text-warning" />
      ) : null}
      {status === 'failed' ? (
        <TriangleAlertIcon className="h-4 w-4 text-destructive" />
      ) : null}
      <span
        className={cn([
          'capitalize text-sm',
          hideText ? 'sr-only' : undefined,
          status === 'failed' ? 'text-destructive' : '',
          status === 'cancelled' ? 'text-warning' : '',
        ])}
      >
        {status}
      </span>
    </div>
  )
}

export default TaskStatusBadge
