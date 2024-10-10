import SelectInput from '@/components/form/input/select-input'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { GeneratorParameterV2 } from '@edenlabs/eden-sdk'

type Props = {
  parameter: GeneratorParameterV2
}

const SampleCountSelector = ({ parameter }: Props) => {
  const { name } = parameter

  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => {
        const { onChange, value, name } = field
        return (
          <FormItem className="flex items-center">
            <FormControl id={name}>
              <SelectInput
                placeholder={'Sample Count'}
                onChange={newVal => onChange(Number(newVal))}
                value={value}
                options={[1, 2, 3, 4]}
                suffix={'x'}
                className={
                  '!mt-0 w-[52px] pl-2.5 pr-1.5 h-[46px] focus:ring-0 font-mono hover:bg-accent'
                }
                optionClassName={'font-mono'}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )
      }}
    />
  )
}

export default SampleCountSelector
