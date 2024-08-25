'use client'

import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { useGeneratorsListQuery } from '@/hooks/query/use-generators-list-query'
import { PropsWithChildren } from 'react'

const baseSegment = 'create'

const PageLayout = ({ children }: PropsWithChildren) => {
  const { generators } = useGeneratorsListQuery({
    outputType: ['image', 'video', 'audio'],
  })

  if (!generators) {
    return null
  }

  return (
    <SecondaryNavLayout
      title={'Tools'}
      wrapClassName={'!pb-0'}
      baseSegment={baseSegment}
      navigation={[
        {
          title: 'Image',
          links: generators
            .filter(generator => generator.outputType === 'image')
            .map(generator => ({
              label: generator.name,
              segments: [baseSegment, 'image', generator.key],
              description: generator.description,
            })),
        },
        {
          title: 'Video',
          links: generators
            .filter(generator => generator.outputType === 'video')
            .map(generator => ({
              label: generator.name,
              segments: [baseSegment, 'video', generator.key],
              description: generator.description,
            })),
        },
        {
          title: 'Audio',
          links: generators
            .filter(generator => generator.outputType === 'audio')
            .map(generator => ({
              label: generator.name,
              segments: [baseSegment, 'audio', generator.key],
              description: generator.description,
            })),
        },
      ]}
    >
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout
