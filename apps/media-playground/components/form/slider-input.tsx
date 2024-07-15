import { Slider } from '@/components/ui/slider'
import { FormEventHandler, useState } from 'react'

type Props = {
  min: number
  max: number
  step: number
  onChange?: FormEventHandler<HTMLDivElement>
  defaultValue: number
  unit?: string
}

const SliderInput = ({
  min,
  max,
  step,
  onChange,
  defaultValue,
  unit,
}: Props) => {
  const [value, setValue] = useState(defaultValue)
  return (
    <div className="relative flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        {min}
        {unit}
      </span>
      <div className="flex-1 relative">
        <Slider
          onDrag={() => {
            console.log('dragging')
          }}
          defaultValue={[defaultValue]}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          onValueChange={val => setValue(val[0])}
          className="flex-1"
        />
        <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-primary-foreground font-medium pointer-events-none bg-popover-foreground rounded-full p-1">
          {value}
          {unit}
        </div>
      </div>
      <span className="text-sm text-muted-foreground">
        {max}
        {unit}
      </span>
    </div>
  )
}

export default SliderInput
