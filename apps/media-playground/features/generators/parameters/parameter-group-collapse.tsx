import { ParameterGroup } from '../utils/parameters'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import ParameterField from '@/features/generators/parameters/parameter-field'
import { cn } from '@/lib/utils'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { useWatch } from 'react-hook-form'
import { UseFormReturn } from 'react-hook-form'

type Props = {
  group: ParameterGroup
  tool: GeneratorV2
  form: UseFormReturn
}

const ParameterGroupCollapse = ({ group, tool, form }: Props) => {
  const toggleName = group.toggle?.name || ''
  const hasToggle = Boolean(group.toggle)

  // Use useWatch to derive isOpen directly from the form's toggle field
  const isOpen = useWatch({
    control: form.control,
    name: toggleName,
    defaultValue: false, //@todo: test this with "use preset"
  })

  const handleTriggerClick = () => {
    if (!hasToggle) return

    // Toggle the current value of the switch in the form
    form.setValue(toggleName, !isOpen)
  }

  // Early return if conditions are not met
  if (
    !group.toggle ||
    !group.groupParameters ||
    !group.groupParameters.length ||
    !hasToggle
  ) {
    return null
  }

  return (
    <Collapsible open={isOpen}>
      <CollapsibleTrigger onClick={handleTriggerClick}>
        <ParameterField
          form={form}
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
        {group.groupParameters.map(param => (
          <ParameterField
            form={form}
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
