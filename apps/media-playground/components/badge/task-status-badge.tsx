import LoadingIndicator from '@/components/loading-indicator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TaskV2 } from '@edenlabs/eden-sdk'
import {
  BanIcon,
  CheckCheckIcon,
  HourglassIcon,
  TriangleAlertIcon,
} from 'lucide-react'

type Props = {
  status: TaskV2['status']
  hideText?: boolean
}
const TaskStatusBadge = ({ status, hideText }: Props) => {
  return (
    <Badge
      variant="secondary"
      className="absolute top-2 left-2 z-10 border-popover-foreground/20"
    >
      {status === 'pending' ? <HourglassIcon className="h-4 w-4" /> : null}
      {status === 'running' ? <LoadingIndicator className="h-4 w-4" /> : null}
      {status === 'cancelled' ? (
        <BanIcon className="h-4 w-4 text-warning" />
      ) : null}
      {status === 'failed' ? (
        <TriangleAlertIcon className="h-4 w-4 text-destructive" />
      ) : null}
      {status === 'completed' ? (
        <CheckCheckIcon className="h-4 w-4 text-success" />
      ) : null}
      <span
        className={cn(['ml-1 capitalize', hideText ? 'sr-only' : undefined])}
      >
        {status}
      </span>
    </Badge>
  )
}

export default TaskStatusBadge
