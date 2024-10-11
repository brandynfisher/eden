import ModelMiniCard from '@/components/card/model-mini-card'
import LoadingIndicator from '@/components/loading-indicator'
import ParameterTable from '@/components/timeline/parameter-table'
import TaskParameter from '@/components/timeline/task-parameter'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { TaskV2 } from '@edenlabs/eden-sdk'
import { ComponentIcon, ListIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

type Props = {
  task: TaskV2
}
const TaskParameterList = ({ task }: Props) => {
  const { prompt, text_input, height, width, name } = task.args

  return (
    <Collapsible
      data-test-id="task-parameter-list"
      className="bg-muted-darker data-[state=open]:animate-none data-[state=closed]:animate-none"
    >
      <div className="relative flex justify-between flex-wrap gap-2 text-sm py-2 px-2 rounded-t-lg">
        <div>
          {name ? (
            <TaskParameter name={'prompt'} label={'Name'} value={name} />
          ) : null}
          {prompt || text_input ? (
            <TaskParameter
              name={'prompt'}
              label={'Prompt'}
              value={prompt || text_input || ''}
            />
          ) : null}
          <div className="flex gap-4 mt-1">
            <TaskParameter
              name={'workflow'}
              label={'Tool'}
              value={task.workflow}
            />
            {width && height ? (
              <TaskParameter
                name={'resolution'}
                label={'Resolution'}
                value={`${width} x ${height}`}
              />
            ) : null}
            <TaskParameter
              name={'createdAt'}
              label={'Date'}
              value={(task.createdAt || new Date('1974-01-01')).toString()}
            />
          </div>
        </div>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            title="Show task configuration"
            className="px-2"
          >
            <ListIcon size={20} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="px-1">
        <div className="mt-2">
          {task.args.lora ? (
            <Suspense fallback={<LoadingIndicator />}>
              <ModelMiniCard modelId={task.args.lora} className="bg-popover">
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/create/image/txt2img?lora=${task.args.lora}`}
                    className="ml-auto mr-2"
                  >
                    <ComponentIcon className="mr-2 h-4 w-4" />
                    Use
                  </Link>
                </Button>
              </ModelMiniCard>
            </Suspense>
          ) : null}
          <ParameterTable args={task.args} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default TaskParameterList
