'use client'

import GeneratorCard from '@/components/card/generator-card'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useGeneratorsListQuery } from '@/hooks/query/use-generators-list-query'
import { GeneratorV2 } from '@edenlabs/eden-sdk'

type Props = {
  title: string
  generators?: GeneratorV2[]
}

const GridSection = ({ title, generators }: Props) => {
  return (
    <div className="mb-8">
      <TypographyH4 className="mb-4">{title}</TypographyH4>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {generators && generators.length ? (
          <>
            {generators.map(generator => (
              <GeneratorCard
                key={generator.key}
                title={generator.name}
                description={generator.description}
                image={`/images/generators/${generator.key}.jpeg`}
                link={`/create/${generator.outputType}/${generator.key}`}
              />
            ))}
          </>
        ) : (
          <div>Nothing found here.</div>
        )}
      </div>
    </div>
  )
}

const GeneratorsGrid = () => {
  const { generators } = useGeneratorsListQuery()

  return (
    <div>
      <GridSection
        title={'Video'}
        generators={generators?.filter(gen => gen.outputType === 'video')}
      />

      <GridSection
        title={'Image'}
        generators={generators?.filter(gen => gen.outputType === 'image')}
      />

      <GridSection
        title={'Model'}
        generators={generators?.filter(gen => gen.outputType === 'lora')}
      />
    </div>
  )
}

export default GeneratorsGrid
