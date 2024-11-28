'use client'

import GeneratorCard from '@/components/card/generator-card'
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
            <GeneratorCard
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

  return (
    <Accordion
      type="multiple"
      defaultValue={
        output_type.length === 1 ? [output_type[0]] : accordionStateQuery.data
      }
      onValueChange={handleAccordionChange}
    >
      {showFeatured ? (
        <AccordionItem key="featured" value="featured">
          <AccordionTrigger className="capitalize bg-primary-foreground/40 hover:bg-primary-foreground/60 px-4">
            <TypographyH4 className="capitalize">Featured</TypographyH4>
          </AccordionTrigger>
          <AccordionContent className="my-4">
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
        <AccordionItem key={type} value={type}>
          <AccordionTrigger className="capitalize bg-primary-foreground/40 hover:bg-primary-foreground/60 px-4">
            <TypographyH4 className="capitalize">{type}</TypographyH4>
          </AccordionTrigger>
          <AccordionContent className="my-4">
            <GridSection
              title={type}
              generators={tools?.filter(tool => tool.output_type === type)}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default ToolsGrid
