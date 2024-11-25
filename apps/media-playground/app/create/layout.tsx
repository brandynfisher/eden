'use client'

import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { useGeneratorsListQuery } from '@/hooks/query/use-generators-list-query'
import { PropsWithChildren } from 'react'

const baseSegment = 'create'

const PageLayout = ({ children }: PropsWithChildren) => {
  const { generators } = useGeneratorsListQuery({
    output_type: ['image', 'video', 'audio'],
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
            .filter(generator => generator.output_type === 'image')
            .map(generator => ({
              label: generator.name,
              private: generator.private,
              segments: [baseSegment, 'image', generator.key],
              description: generator.description,
            })),
        },
        {
          title: 'Video',
          links: generators
            .filter(generator => generator.output_type === 'video')
            .map(generator => ({
              label: generator.name,
              private: generator.private,
              segments: [baseSegment, 'video', generator.key],
              description: generator.description,
            })),
        },
        {
          title: 'Audio',
          links: generators
            .filter(generator => generator.output_type === 'audio')
            .map(generator => ({
              label: generator.name,
              private: generator.private,
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
