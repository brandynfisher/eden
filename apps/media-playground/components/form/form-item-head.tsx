import { FormDescription, FormLabel } from '@/components/ui/form'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { InfoIcon } from 'lucide-react'

type Props = {
  label: string
  description: string
}

const FormItemHead = ({ label, description }: Props) => {
  return (
    <div className="space-y-0.5 flex">
      <FormLabel className="text-sm first-letter:uppercase mr-2">
        {label}
      </FormLabel>
      <FormDescription className="ml-auto">
        <TooltipProvider delayDuration={125}>
          <Tooltip>
            <TooltipTrigger
              className="hover:text-accent-foreground cursor-pointer"
              onClick={ev => ev.preventDefault()}
            >
              <InfoIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>{description}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </FormDescription>
    </div>
  )
}

export default FormItemHead
