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

  const handleCopy = (parameterName: string, text: string) => () => {
    copy(text)
      .then(() => {
        toast(
          getToastConfig(
            `Copied value for "${parameterName}"`,
            text,
            'success',
          ),
        )
        console.log('Copied!', { copiedText })
      })
      .catch(error => {
        toast(getToastConfig(`Failed to copy!`, error, 'error'))
        console.error('Failed to copy!', error)
      })
  }

  return (
    <Table className="text-sm">
      <TableCaption>Configuration used for this task</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Parameter</TableHead>
          <TableHead className="py-2">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(task.args).map(taskArg => (
          <TableRow
            key={taskArg[0]}
            onClick={handleCopy(taskArg[0], String(taskArg[1]))}
          >
            <TableCell className="py-2">{taskArg[0]}</TableCell>
            <TableCell className="py-2">{taskArg[1]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default TaskParameterTable
