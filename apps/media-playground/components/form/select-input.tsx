import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  placeholder: string
  onChange: (newVal: string | number) => void
  defaultValue: string | number
  options: (string | number)[]
}

const SelectInput = ({
  placeholder,
  onChange,
  defaultValue,
  options,
}: Props) => {
  return (
    <Select onValueChange={onChange} defaultValue={String(defaultValue || '')}>
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
    </Select>
  )
}

export default SelectInput
