import TaskParameter from '@/components/timeline/task-parameter'
import { TaskV2 } from '@edenlabs/eden-sdk'

type Props = {
  task: TaskV2
}
const TaskParameterList = ({ task }: Props) => {
  const { prompt, height, width } = task.args

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {prompt ? (
        <TaskParameter name={'prompt'} label={'Prompt'} value={prompt} />
      ) : null}
      <TaskParameter
        name={'workflow'}
        label={'Workflow'}
        value={task.workflow}
      />
      <TaskParameter
        name={'resolution'}
        label={'Resolution'}
        value={`${width} x ${height}`}
      />
      <TaskParameter name={'createdAt'} label={'Date'} value={task.createdAt} />
      {/*<TaskParameter name={'date'} label={'Date'} value={`${task.created_at}`} />*/}

      {/*{Object.entries(rest).map((arg) => {*/}
      {/*  console.log(arg)*/}
      {/*  return <TaskParameter key={arg[0]} name={arg[0]} label={arg[0]} value={arg[1]} />*/}
      {/*})}*/}
    </div>
  )
}

export default TaskParameterList
