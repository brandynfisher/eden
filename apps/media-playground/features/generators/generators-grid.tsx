'use client'

import GeneratorCard from '@/components/card/generator-card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useGeneratorsListQuery } from '@/hooks/query/use-generators-list-query'
import useLocalStorage from '@/hooks/use-local-storage'
import { siteConfig } from '@/lib/config'
import { GeneratorOutputTypeV2, GeneratorV2 } from '@edenlabs/eden-sdk'

type Props = {
  title: string
  generators?: GeneratorV2[]
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
                generator.outputType === 'lora'
                  ? 'train'
                  : `create/${generator.outputType}`
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

type GeneratorsGridProps = {
  outputType: GeneratorOutputTypeV2[]
  showFeatured?: boolean
}

const GeneratorsGrid = ({ outputType, showFeatured }: GeneratorsGridProps) => {
  const { generators } = useGeneratorsListQuery({ outputType })

  const [accordionState, setAccordionState] = useLocalStorage<string[]>(
    'generatorsGridAccordionState',
    ['featured', ...outputType],
  )

  const handleAccordionChange = (value: string[]) => {
    setAccordionState(value)
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={outputType.length === 1 ? outputType[0] : accordionState}
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
              generators={generators?.filter(gen =>
                siteConfig.featured.tools.includes(gen.key),
              )}
              priority={true}
            />
          </AccordionContent>
        </AccordionItem>
      ) : null}
      {outputType?.map(type => (
        <AccordionItem key={type} value={type}>
          <AccordionTrigger className="capitalize bg-primary-foreground/40 hover:bg-primary-foreground/60 px-4">
            <TypographyH4 className="capitalize">{type}</TypographyH4>
          </AccordionTrigger>
          <AccordionContent className="my-4">
            <GridSection
              title={type}
              generators={generators?.filter(gen => gen.outputType === type)}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default GeneratorsGrid
