import {
  DelayedSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  placeholder: string
  onChange: (newVal: string | number) => void
  value: string | number
  options: (string | number)[]
}

const SelectInput = ({ placeholder, onChange, value, options }: Props) => {
  return (
    <DelayedSelect onValueChange={onChange} value={String(value || '')}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option} value={String(option)}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </DelayedSelect>
  )
}

export default SelectInput
