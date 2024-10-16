import {
  DelayedSelect,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type Props = {
  placeholder: string
  label?: string
  icon?: ReactNode
  onChange: (newVal: string | number) => void
  value: string | number
  options: (string | number)[]
  suffix?: string
  className?: string
  optionClassName?: string
}

const SelectInput = ({
  placeholder,
  label,
  icon,
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
        {icon}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {label ? (
            <SelectLabel className="border border-t-0 border-l-0 border-r-0 border-b-secondary mb-0.5">
              {label}
            </SelectLabel>
          ) : null}
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
        </SelectGroup>
      </SelectContent>
    </DelayedSelect>
  )
}

export default SelectInput
