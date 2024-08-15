import { SliderWithTooltip } from '@/components/ui/custom/slider-with-tooltip'
import { UseFormReturn } from 'react-hook-form'

type Props = {
  form: UseFormReturn
  min: number
  max: number
  step: number
  onChange: (newVal: number) => void
  value: number
  unit?: string
}

const SliderInputRangeLabel = ({ text }: { text: string }) => {
  return <span className="text-sm text-muted-foreground font-mono">{text}</span>
}

const SliderInput = ({ min, max, step, onChange, value, unit }: Props) => {
  return (
    <div className="relative flex items-center gap-4">
      <SliderInputRangeLabel text={`${min}${unit || ''}`} />
      <div className="flex-1 relative">
        <SliderWithTooltip
          className="flex-1"
          defaultValue={[value]}
          value={[value]}
          min={min}
          max={max}
          step={step}
          showTooltip={true}
          onValueChange={val => {
            onChange(val[0])
          }}
        />
      </div>
      <SliderInputRangeLabel text={`${max}${unit || ''}`} />
    </div>
  )
}

export default SliderInput
