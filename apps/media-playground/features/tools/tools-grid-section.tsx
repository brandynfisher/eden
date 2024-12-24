import ToolCard from '@/components/card/tool-card'
import { ToolV2 } from '@edenlabs/eden-sdk'

type GridSectionProps = {
  title: string
  generators?: ToolV2[]
  priority?: boolean
}

export const getMediaUrl = (mediaFileName: string) => {
  return `https://d14i3advvh2bvd.cloudfront.net/${mediaFileName}`
}

const GridSection = ({ generators, priority }: GridSectionProps) => {
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

export default GridSection
