import { SliderWithTooltip } from '@/components/ui/custom/slider-with-tooltip'

type Props = {
  min: number
  max: number
  step: number
  onChange: (newVal: number) => void
  defaultValue: number
  unit?: string
}

const SliderInputRangeLabel = ({ text }: { text: string }) => {
  return <span className="text-sm text-muted-foreground font-mono">{text}</span>
}

const SliderInput = ({
  min,
  max,
  step,
  onChange,
  defaultValue,
  unit,
}: Props) => {
  // const [value, setValue] = useState([defaultValue])
  return (
    <div className="relative flex items-center gap-4">
      <SliderInputRangeLabel text={`${min}${unit || ''}`} />
      <div className="flex-1 relative">
        <SliderWithTooltip
          className="flex-1"
          defaultValue={[defaultValue]}
          min={min}
          max={max}
          step={step}
          showTooltip={true}
          onValueCommit={val => {
            onChange(val[0])
          }}
        />
      </div>
      <SliderInputRangeLabel text={`${max}${unit || ''}`} />
    </div>
  )
}

export default SliderInput
