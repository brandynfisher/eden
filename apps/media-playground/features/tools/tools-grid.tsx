'use client'

import ToolCard from '@/components/card/tool-card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useToolsListQuery } from '@/hooks/query/use-tools-list-query'
import useLocalStorage from '@/hooks/use-local-storage'
import { siteConfig } from '@/lib/config'
import { ToolOutputTypeV2, ToolV2 } from '@edenlabs/eden-sdk'

type Props = {
  title: string
  generators?: ToolV2[]
  priority?: boolean
}

const getMediaUrl = (mediaFileName: string) => {
  return `https://d14i3advvh2bvd.cloudfront.net/${mediaFileName}`
}

const GridSection = ({ generators, priority }: Props) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {generators && generators.length ? (
        <>
          {generators.map(generator => (
            <ToolCard
              key={generator.key}
              title={generator.name}
              description={generator.description}
              image={getMediaUrl(generator.thumbnail || '')}
              link={`/${
                generator.output_type === 'lora'
                  ? 'train'
                  : `create/${generator.output_type}`
              }/${generator.key}`}
              isPrivate={generator.private}
              priority={priority}
            />
          ))}
        </>
      ) : (
        <div>Nothing found here.</div>
      )}
    </div>
  )
}

type ToolsGridProps = {
  output_type: ToolOutputTypeV2[]
  showFeatured?: boolean
}

const ToolsGrid = ({ output_type, showFeatured }: ToolsGridProps) => {
  const { tools } = useToolsListQuery({ output_type })

  const [accordionStateQuery, setAccordionState] = useLocalStorage<string[]>(
    'generatorsGridAccordionState',
    ['featured', ...output_type],
  )

  const handleAccordionChange = (value: string[]) => {
    setAccordionState(value)
  }

  if (accordionStateQuery.isLoading) {
    return null
  }

  const eden2Tools = tools?.filter(tool => !tool.key.includes('legacy'))
  const legacyTools = tools?.filter(tool => tool.key.includes('legacy'))

  return (
    <div>
      <Accordion
        type="multiple"
        defaultValue={
          output_type.length === 1 ? [output_type[0]] : accordionStateQuery.data
        }
        onValueChange={handleAccordionChange}
        className="rounded-md overflow-hidden"
      >
        {showFeatured ? (
          <AccordionItem key="featured" value="featured" className="bg-popover">
            <AccordionTrigger className="capitalize bg-primary-foreground hover:bg-primary-foreground/60 px-4">
              <TypographyH4 className="capitalize">Featured</TypographyH4>
            </AccordionTrigger>
            <AccordionContent className="my-4 px-4">
              <GridSection
                title="Featured"
                generators={tools?.filter(tool =>
                  siteConfig.featured.tools.includes(tool.key),
                )}
                priority={true}
              />
            </AccordionContent>
          </AccordionItem>
        ) : null}
        {output_type?.map(type => (
          <AccordionItem key={type} value={type} className="bg-popover">
            <AccordionTrigger className="capitalize bg-primary-foreground hover:bg-primary-foreground/60 px-4">
              <TypographyH4 className="capitalize">{type}</TypographyH4>
            </AccordionTrigger>
            <AccordionContent className="my-4 px-4">
              <GridSection
                title={type}
                generators={eden2Tools?.filter(
                  tool => tool.output_type === type,
                )}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {output_type && output_type[0] !== 'lora' ? (
        <div className="p-2 mt-4 rounded-lg bg-secondary">
          <div className="mb-2 text-sm">Eden Classic Tools</div>
          <Accordion type="multiple" className="rounded-md overflow-hidden">
            {output_type?.map(type => (
              <div key={type}>
                {legacyTools?.some(tool => tool.output_type === type) ? (
                  <AccordionItem key={type} value={type} className="bg-popover">
                    <AccordionTrigger className="capitalize bg-primary-foreground hover:bg-primary-foreground/60 px-4">
                      <TypographyH4 className="capitalize">{type}</TypographyH4>
                    </AccordionTrigger>
                    <AccordionContent className="my-4 px-4">
                      <GridSection
                        title={type}
                        generators={legacyTools?.filter(
                          tool => tool.output_type === type,
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ) : null}
              </div>
            ))}
          </Accordion>
        </div>
      ) : null}
    </div>
  )
}

export default ToolsGrid
