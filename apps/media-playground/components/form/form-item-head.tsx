import { FormDescription, FormLabel } from '@/components/ui/form'

type Props = {
  label: string
  description: string
}

const FormItemHead = ({ label, description }: Props) => {
  return (
    <div className="space-y-0.5">
      <FormLabel className="text-base capitalize">{label}</FormLabel>
      <FormDescription>{description}</FormDescription>
    </div>
  )
}

export default FormItemHead
