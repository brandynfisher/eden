import { ParameterGroup } from '../utils/parameters'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import ParameterField from '@/features/generators/parameters/parameter-field'
import { cn } from '@/lib/utils'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { UseFormReturn } from 'react-hook-form'

type Props = {
  group: ParameterGroup
  tool: GeneratorV2
  form: UseFormReturn
}
const ParameterGroupCollapse = ({ group, tool, form }: Props) => {
  if (
    !group.groupParameters ||
    !group.groupParameters.length ||
    !group.toggle
  ) {
    return null
  }

  const isOpen = form.watch(group.toggle.name)

  return (
    <Collapsible open={isOpen}>
      <CollapsibleTrigger asChild>
        <ParameterField
          tool={tool}
          parameter={group.toggle}
          className={cn([
            'border transition-colors',
            isOpen
              ? 'bg-muted-foreground/10 border border-gray-400/20 rounded-b-none'
              : 'border border-muted bg-popover',
          ])}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn([
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
            : '',
        ])}
      >
        {group.groupParameters?.map(param => (
          <ParameterField
            key={param.name}
            tool={tool}
            parameter={param}
            className="bg-muted-darker mx-2"
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default ParameterGroupCollapse
