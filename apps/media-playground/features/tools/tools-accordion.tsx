'use client'

import { ToolsAccordionItem } from './tools-accordion-item'
import { Accordion } from '@/components/ui/accordion'
import { useFilteredToolsQuery } from '@/hooks/use-filtered-tools-query'
import useLocalStorage from '@/hooks/use-local-storage'
import { siteConfig } from '@/lib/config'
import { ToolOutputTypeV2 } from '@edenlabs/eden-sdk'

// your new reusable component

type ToolsGridProps = {
  output_type: ToolOutputTypeV2[]
  showFeatured?: boolean
}

const ToolsAccordion = ({ output_type, showFeatured }: ToolsGridProps) => {
  const { tools } = useFilteredToolsQuery({ output_type })

  // Generate all possible accordion values including classic tools
  const allAccordionValues = [
    ...(showFeatured ? ['featured'] : []),
    ...output_type,
    ...(output_type[0] !== 'lora'
      ? output_type.map(type => `classic-${type}`)
      : []),
  ]

  const [accordionStateQuery, setAccordionState] = useLocalStorage<string[]>(
    'generatorsGridAccordionState',
    allAccordionValues,
  )

  // Ensure Model Trainers (lora) is always open by default
  const ensureLoraOpen = (values: string[]) => {
    if (output_type.includes('lora') && !values.includes('lora')) {
      return [...values, 'lora']
    }
    return values
  }

  const handleAccordionChange = (value: string[]) => {
    setAccordionState(value)
  }

  // Separate Eden v2 Tools from Legacy Tools
  const eden2Tools = tools?.filter(tool => !tool.key.includes('legacy'))
  const legacyTools = tools?.filter(tool => tool.key.includes('legacy'))

  // Use a consistent default value for SSR
  const defaultAccordionValue =
    output_type.length === 1 ? allAccordionValues : allAccordionValues

  return (
    <div>
      <Accordion
        type="multiple"
        defaultValue={defaultAccordionValue}
        value={
          accordionStateQuery.isLoading
            ? undefined
            : ensureLoraOpen(accordionStateQuery.data || [])
        }
        onValueChange={handleAccordionChange}
        className="rounded-md overflow-hidden"
      >
        {/* FEATURED */}
        {showFeatured && (
          <ToolsAccordionItem
            label="Featured"
            value="featured"
            tools={tools?.filter(tool =>
              siteConfig.featured.tools.includes(tool.key),
            )}
            priority
          />
        )}

        {/* REGULAR TOOLS */}
        {output_type.map(type => (
          <ToolsAccordionItem
            key={type}
            label={type === 'lora' ? 'Model Trainers' : type}
            value={type}
            tools={eden2Tools?.filter(tool => tool.output_type === type)}
          />
        ))}

        {/* CLASSIC TOOLS */}
        {output_type && output_type[0] !== 'lora' && (
          <>
            {output_type.map(type => {
              const classicTools = legacyTools?.filter(
                tool => tool.output_type === type,
              )
              if (!classicTools || !classicTools.length) return null

              return (
                <ToolsAccordionItem
                  key={`classic-${type}`}
                  label={`Classic ${type}`}
                  value={`classic-${type}`}
                  tools={classicTools}
                />
              )
            })}
          </>
        )}
      </Accordion>
    </div>
  )
}

export default ToolsAccordion
