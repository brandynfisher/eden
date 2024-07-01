import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { generators } from '@/features/generators/dummyConfig'

type Props = {
  params: {
    generator: string
  }
}

const VideoGeneratorPage = ({ params }: Props) => {
  const { generator } = params

  const generatorMetaData = generator
    ? generators.video.filter(gen => gen.name === generator)[0]
    : undefined

  if (!generatorMetaData) {
    return {
      notFound: true,
    }
  }

  return (
    <div>
      <TypographyH3>create - video - {generator}</TypographyH3>
      <pre>
        generatorMetaData:
        {JSON.stringify(generatorMetaData, null, 2)}
      </pre>
    </div>
  )
}

export default VideoGeneratorPage
