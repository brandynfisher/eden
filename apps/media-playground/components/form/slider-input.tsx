import { SliderWithTooltip } from '@/components/ui/custom/slider-with-tooltip'
import { cn } from '@/lib/utils'
import { UseFormReturn } from 'react-hook-form'

type Props = {
  form: UseFormReturn
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

const SliderInput = ({ min, max, step, onChange, value, unit }: Props) => {
  return (
    <>
      <div className="relative flex items-center gap-4 w-full">
        <SliderInputRangeLabel
          text={`${min}${unit || ''}`}
          className="text-xs left-4 z-50 filter invert opacity-80"
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
          className="text-xs right-4 z-50 filter invert opacity-80"
        />
      </div>
    </>
  )
}

export default SliderInput
