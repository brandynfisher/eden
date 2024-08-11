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
import { GeneratorOutputTypeV2, GeneratorV2 } from '@edenlabs/eden-sdk'

type Props = {
  title: string
  generators?: GeneratorV2[]
}

const GridSection = ({ generators }: Props) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {generators && generators.length ? (
        <>
          {generators.map(generator => (
            <GeneratorCard
              key={generator.key}
              title={generator.name}
              description={generator.description}
              image={`/images/generators/${generator.key}.${generator.outputType === 'video' ? 'mp4' : 'jpeg'}`}
              link={`/${generator.outputType === 'lora' ? 'train' : `create/${generator.outputType}`}/${generator.key}`}
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
}

const GeneratorsGrid = ({ outputType }: GeneratorsGridProps) => {
  const { generators } = useGeneratorsListQuery({ outputType })

  return (
    <Accordion type="multiple" defaultValue={outputType}>
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
