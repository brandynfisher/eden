import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getToastConfig } from '@/lib/toast'
import { TaskV2 } from '@edenlabs/eden-sdk'
import React from 'react'

type Props = {
  task: TaskV2
}

const TaskParameterTable = ({ task }: Props) => {
  const [copiedText, copy] = useCopyToClipboard()
  const { toast } = useToast()

  const handleCopyString = (parameterName: string, text: string) => () => {
    copy(text)
      .then(() => {
        toast(getToastConfig(`Copied "${parameterName}":`, text, 'success'))
        console.log('Copied!', { copiedText })
      })
      .catch(error => {
        toast(getToastConfig(`Failed to copy!`, error, 'error'))
        console.error('Failed to copy!', error)
      })
  }

  return (
    <Table className="text-xs mt-2">
      <TableCaption>Configuration used for this task</TableCaption>
      <TableHeader>
        <TableRow className="bg-popover/40">
          <TableHead className="h-10 py-2 w-[100px]">Parameter</TableHead>
          <TableHead className="h-10 py-2">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(task.args).map(taskArg => (
          <TableRow
            className="cursor-copy text-xs"
            key={taskArg[0]}
            onClick={handleCopyString(
              taskArg[0],
              String(taskArg[1] !== null ? taskArg[1] : ''),
            )}
          >
            <TableCell className="py-2 text-muted-foreground">
              {taskArg[0]}
            </TableCell>
            <TableCell className="py-2">{taskArg[1]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default TaskParameterTable
