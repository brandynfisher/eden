import { SliderWithTooltip } from '@/components/ui/custom/slider-with-tooltip'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { UseFormReturn } from 'react-hook-form'

type Props = {
  form: UseFormReturn
  type: string
  min: number
  max: number
  step: number
  onChange: (newVal: number | undefined) => void
  value: number
  unit?: string
}

const SliderInputRangeLabel = ({
  text,
  className,
}: {
  text: string
  className?: string
}) => {
  return (
    <span
      className={cn([
        'absolute text-sm font-mono pointer-events-none mix-blend-difference filter invert text-popover',
        className,
      ])}
    >
      {text}
    </span>
  )
}

const SliderInput = ({
  type,
  min,
  max,
  step,
  onChange,
  value,
  unit,
}: Props) => {
  return (
    <div className="flex items-center">
      <div className="relative flex items-center gap-4 w-full">
        <SliderInputRangeLabel
          text={`${min}${unit || ''}`}
          className="text-xs left-4 z-50 filter invert opacity-60"
        />
        <div className="flex-1 relative">
          <SliderWithTooltip
            className="flex-1 h-10"
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
        <SliderInputRangeLabel
          text={`${max}${unit || ''}`}
          className="text-xs right-4 z-50 filter invert opacity-60"
        />
      </div>
      <Input
        className="w-20 h-8 rounded-md rounded-l-none relative font-mono"
        type="number"
        min={max || 0}
        max={max || 1}
        step={step ? step : 1}
        value={value}
        onChange={e =>
          onChange(
            e.target.value
              ? type === 'int'
                ? parseInt(e.target.value)
                : parseFloat(e.target.value)
              : undefined,
          )
        }
      />
    </div>
  )
}

export default SliderInput
