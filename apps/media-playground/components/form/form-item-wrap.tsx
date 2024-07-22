import FormItemHead from '@/components/form/form-item-head'
import { FormControl, FormItem, FormMessage } from '@/components/ui/form'
import { PropsWithChildren } from 'react'

type Props = {
  name: string
  label: string
  description: string
  errorMessage?: string
} & PropsWithChildren

const FormItemWrap = ({
  name,
  label,
  description,
  errorMessage,
  children,
}: Props) => {
  return (
    <FormItem className="mt-0 !p-4 !pt-3">
      <FormItemHead label={label} description={description} />
      <FormControl id={name}>{children}</FormControl>
      <FormMessage>{errorMessage}</FormMessage>
    </FormItem>
  )
}

export default FormItemWrap
