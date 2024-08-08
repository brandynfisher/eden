import TaskParameter from '@/components/timeline/task-parameter'
import { TaskV2 } from '@edenlabs/eden-sdk'

type Props = {
  task: TaskV2
}
const TaskParameterList = ({ task }: Props) => {
  const { prompt, height, width, name } = task.args

  return (
    <div
      data-test-id="task-parameter-list"
      className="relative flex flex-wrap gap-2 text-sm py-2 px-2 rounded-t-lg bg-muted/60"
    >
      {name ? (
        <TaskParameter name={'prompt'} label={'Name'} value={name} />
      ) : null}
      {prompt ? (
        <TaskParameter name={'prompt'} label={'Prompt'} value={prompt} />
      ) : null}
      <TaskParameter
        name={'workflow'}
        label={'Workflow'}
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
        value={task.createdAt.toString()}
      />
    </div>
  )
}

export default TaskParameterList
