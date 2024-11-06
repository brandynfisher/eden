import { ParameterGroup } from '../utils/parameters'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import ParameterField from '@/features/generators/parameters/parameter-field'
import { cn } from '@/lib/utils'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { ChevronDownIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { UseFormReturn } from 'react-hook-form'

type Props = {
  group: ParameterGroup
  tool: GeneratorV2
  form: UseFormReturn
}

const ParameterGroupCollapse = ({ group, tool, form }: Props) => {
  const toggleName = group.toggle?.name || ''
  const [isOpen, setIsOpen] = useState(false)

  // Use useWatch to derive the initial isOpen value directly from the form's toggle field
  const isWatchedActive = useWatch({
    control: form.control,
    name: toggleName,
    // defaultValue: false, // @todo: test this with "use preset"
  })

  // Sync the isOpen state with the form's value
  useEffect(() => {
    setIsOpen(isWatchedActive)
  }, [isWatchedActive])

  const handleOpenChange = (newOpenState: boolean) => {
    setIsOpen(newOpenState)
  }

  // Early return if conditions are not met
  if (
    !group.toggle ||
    !group.groupParameters ||
    !group.groupParameters.length
  ) {
    return null
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={'w-full'}
    >
      <CollapsibleTrigger className="w-full cursror-pointer">
        <ParameterField
          icon={
            <ChevronDownIcon
              className={cn([
                'w-4 h-4 mr-2 transition',
                isOpen ? ' rotate-[-180deg]' : '',
              ])}
            />
          }
          form={form}
          tool={tool}
          parameter={group.toggle}
          className={cn([
            'border transition-colors',
            isOpen
              ? 'bg-muted-foreground/10 border border-gray-400/20 rounded-b-none'
              : 'border border-muted bg-popover',
            isWatchedActive ? 'bg-muted-foreground/5 border-gray-400/20' : '',
          ])}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn([
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
            : '',
          // isWatchedActive ? '' : ''
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
