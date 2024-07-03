import GeneratorCard from '@/components/card/generator-card'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { generators } from '@/features/generators/dummyConfig'

const CreatePage = () => {
  return (
    <div className="flex flex-col gap-4">
      <TypographyH3>Create</TypographyH3>

      <div>
        <TypographyH4 className="mb-4">Video</TypographyH4>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {generators.video.map(gen => (
            <GeneratorCard
              key={gen.name}
              title={gen.title}
              description={gen.description}
              image={`/images/generators/${gen.name}.jpeg`}
              link={`/create/${gen.outputType}/${gen.name}`}
            />
          ))}
        </div>
      </div>

      <div>
        <TypographyH4 className="mb-4">Image</TypographyH4>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {generators.image.map(gen => (
            <GeneratorCard
              key={gen.name}
              title={gen.title}
              description={gen.description}
              image={`/images/generators/${gen.name}.jpeg`}
              link={`/create/${gen.outputType}/${gen.name}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default CreatePage
