import {
  DelayedSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type Props = {
  placeholder: string
  onChange: (newVal: string | number) => void
  value: string | number
  options: (string | number)[]
  className?: string
  optionClassName?: string
  suffix?: string
}

const SelectInput = ({
  placeholder,
  onChange,
  value,
  options,
  suffix,
  className,
  optionClassName,
}: Props) => {
  return (
    <DelayedSelect onValueChange={onChange} value={String(value || '')}>
      <SelectTrigger className={cn(['w-full', className])} title={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem
            key={option}
            value={String(option)}
            className={optionClassName}
          >
            {option}
            {suffix}
          </SelectItem>
        ))}
      </SelectContent>
    </DelayedSelect>
  )
}

export default SelectInput
