import { Slider } from '@/components/ui/slider'
import { FormEventHandler } from 'react'

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
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        {min}
        {unit}
      </span>
      <Slider
        defaultValue={[defaultValue]}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        className="flex-1"
      />
      <span className="text-sm text-muted-foreground">
        {max}
        {unit}
      </span>
    </div>
  )
}

export default SliderInput
