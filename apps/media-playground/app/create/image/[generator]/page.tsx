import GeneratorForm from '@/components/form/generator-form'
import Timeline from '@/components/timeline/timeline'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { generators } from '@/features/generators/dummyConfig'

type Props = {
  params: {
    generator: string
  }
}

const ImageGeneratorPage = ({ params }: Props) => {
  const { generator } = params

  // @todo: grab generator config from fastify in memory store (needs a cute little endpoint to retrieve it)
  // @todo: quite similar to /generators
  const generatorMetaData = generator
    ? generators.image.filter(gen => gen.name === generator)[0]
    : undefined

  if (!generatorMetaData) {
    return {
      notFound: true,
    }
  }

  return (
    <div>
      <TypographyH3>create - image - {generator}</TypographyH3>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GeneratorForm generator={generatorMetaData} />
        {/*<Timeline generator={generatorMetaData} />*/}
        <Timeline />
      </div>
    </div>
  )
}

export default ImageGeneratorPage
