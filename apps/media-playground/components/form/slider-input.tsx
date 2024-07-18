import { Slider } from '@/components/ui/slider'
import { FormEventHandler, useState } from 'react'

type Props = {
  min: number
  max: number
  step: number
  onChange: FormEventHandler<HTMLDivElement>
  defaultValue: number
  unit?: string
}

const SliderInputRangeLabel = ({ text }: { text: string }) => {
  return <span className="text-sm text-muted-foreground">{text}</span>
}

const SliderInputThumb = ({ text }: { text: string }) => {
  return (
    <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-primary-foreground font-medium pointer-events-none bg-popover-foreground rounded-full p-1">
      {text}
    </div>
  )
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
      <SliderInputRangeLabel text={`${min}${unit}`} />
      <div className="flex-1 relative">
        <Slider
          className="flex-1"
          onDrag={e => {
            console.log('onDrag', e)
          }}
          defaultValue={[defaultValue]}
          min={min}
          max={max}
          step={step}
          onChange={e => {
            console.log('onChange', e)
            onChange(e)
          }}
          onDragStart={e => {
            console.log('onDragStart', e)
          }}
          onValueChange={val => {
            console.log('onValueChange', val)
            setValue(val[0])
            // onChange(e)
          }}
        />
        <SliderInputThumb text={`${value}${unit}`} />
      </div>
      <SliderInputRangeLabel text={`${max}${unit}`} />
    </div>
  )
}

export default SliderInput
