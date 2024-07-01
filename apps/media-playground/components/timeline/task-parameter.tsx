type Props = {
  name: string
  label: string
  value: string | number | boolean | null
}

const TaskParameter = ({ name, label, value }: Props) => {
  return (
    <>
      {name === 'prompt' ? (
        <div className="w-full flex gap-2">
          <div className="flex-shrink-0 text-primary/60 w-[72px]">{label}</div>
          <div>{value}</div>
        </div>
      ) : null}

      {name === 'workflow' ? (
        <div className="flex gap-2">
          <div className="text-primary/60 w-[72px]">{label}</div>
          <div className="w-[72px]">{value}</div>
        </div>
      ) : null}

      {name === 'resolution' ? (
        <div className="col-span-3 flex gap-2">
          <div className="text-primary/60 w-[72px]">{label}</div>
          <div className="w-[72px]">{value}</div>
        </div>
      ) : null}

      {/*{ name === 'date' ? (*/}
      {/*  <div className='col-span-3 flex gap-2'>*/}
      {/*    <div className='text-primary/60 w-[72px]'>{label}</div>*/}
      {/*    <div className='w-[72px]'>{value}</div>*/}
      {/*  </div>*/}
      {/*) : null}*/}
    </>
  )
}

export default TaskParameter
