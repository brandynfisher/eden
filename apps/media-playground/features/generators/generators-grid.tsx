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

const toolThumbnails: { [key: string]: GeneratorV2['key'] } = {
  // videos
  animate_3D: 'animate_3D.mp4',
  style_mixing: 'style_mixing.mp4',
  txt2vid: 'txt2vid.mp4',

  // images
  background_removal: 'background_removal.jpeg',
  clarity_upscaler: 'clarity_upscaler.jpeg',
  face_styler: 'face_styler.jpeg',
  inpaint: 'inpaint.jpeg',
  SD3: 'SD3.jpeg',
  txt2img: 'txt2img.jpeg',
  txt2img2: 'txt2img2.jpeg',

  img2vid: 'img2vid.jpeg',
  vid2vid: 'vid2vid.jpeg',
  video_upscaler: 'video_upscaler.jpeg',
}

const getImageUrl = (generatorKey: GeneratorV2['key']) => {
  const imageFileName = toolThumbnails[generatorKey]

  if (imageFileName) {
    return `/images/generators/${imageFileName}`
  }

  return '/logo-bw.png'
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
              image={getImageUrl(generator.key)}
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
