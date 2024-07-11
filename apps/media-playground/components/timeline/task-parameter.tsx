import { useTimeAgo } from 'next-timeago'

type Props = {
  name: string
  label: string
  value: string | number | boolean | null
}

const TaskParameter = ({ name, label, value }: Props) => {
  const { TimeAgo } = useTimeAgo()

  return (
    <>
      {name === 'prompt' ? (
        <div className="w-full flex gap-2 text-xs">
          {/*<div className="flex-shrink-0 text-primary/60">{label}</div>*/}
          <div className="line-clamp-2">{value}</div>
        </div>
      ) : null}

      {name === 'workflow' ? (
        <div className="flex gap-2 text-xs">
          <div className="text-primary/60">{label}</div>
          <div>{value}</div>
        </div>
      ) : null}

      {name === 'resolution' ? (
        <div className="col-span-3 flex gap-2 text-xs">
          <div className="text-primary/60">{label}</div>
          <div>{value}</div>
        </div>
      ) : null}

      {name === 'createdAt' && value ? (
        <div className="col-span-3 flex gap-2 ml-auto text-muted-foreground text-xs">
          <div>
            <TimeAgo date={String(value)} />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default TaskParameter
