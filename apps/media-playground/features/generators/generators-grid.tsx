'use client'

import GeneratorCard from '@/components/card/generator-card'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useGeneratorsQuery } from '@/hooks/query/use-generator-query'

const GeneratorsGrid = () => {
  const { generators } = useGeneratorsQuery()

  return (
    <div>
      <div>
        <TypographyH4 className="mb-4">Video</TypographyH4>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {generators
            ?.filter(generator => generator.outputType === 'video')
            .map(generator => (
              <GeneratorCard
                key={generator.key}
                title={generator.name}
                description={generator.description}
                image={`/images/generators/${generator.key}.jpeg`}
                link={`/create/${generator.outputType}/${generator.key}`}
              />
            ))}
        </div>
      </div>

      <div>
        <TypographyH4 className="mb-4">Image</TypographyH4>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {generators
            ?.filter(gen => gen.outputType === 'image')
            .map(gen => (
              <GeneratorCard
                key={gen.key}
                title={gen.name}
                description={gen.description}
                image={`/images/generators/${gen.key}.jpeg`}
                link={`/create/${gen.outputType}/${gen.key}`}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

export default GeneratorsGrid
