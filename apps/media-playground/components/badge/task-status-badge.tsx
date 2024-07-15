import LoadingIndicator from '@/components/loading-indicator'
import { cn } from '@/lib/utils'
import { TaskV2 } from '@edenlabs/eden-sdk'
import { BanIcon, HourglassIcon, TriangleAlertIcon } from 'lucide-react'

type Props = {
  status: TaskV2['status']
  hideText?: boolean
}
const TaskStatusBadge = ({ status, hideText }: Props) => {
  return (
    <div className="absolute top-2 left-2 z-10">
      {status === 'pending' ? <HourglassIcon className="h-4 w-4" /> : null}
      {status === 'running' ? (
        <LoadingIndicator className="h-6 w-6 text-indigo-700" />
      ) : null}
      {status === 'cancelled' ? (
        <BanIcon className="h-4 w-4 text-warning" />
      ) : null}
      {status === 'failed' ? (
        <TriangleAlertIcon className="h-4 w-4 text-destructive" />
      ) : null}
      <span
        className={cn(['ml-1 capitalize', hideText ? 'sr-only' : undefined])}
      >
        {status}
      </span>
    </div>
  )
}

export default TaskStatusBadge
