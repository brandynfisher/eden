'use client'

import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { useToolsListQuery } from '@/hooks/query/use-tools-list-query'
import { PropsWithChildren } from 'react'

const baseSegment = 'create'

const PageLayout = ({ children }: PropsWithChildren) => {
  const { tools } = useToolsListQuery({
    output_type: ['image', 'video', 'audio'],
  })

  if (!tools) {
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
          links: tools
            .filter(tool => tool.output_type === 'image')
            .map(tool => ({
              label: tool.name,
              private: tool.private,
              segments: [baseSegment, 'image', tool.key],
              description: tool.description,
            })),
        },
        {
          title: 'Video',
          links: tools
            .filter(tool => tool.output_type === 'video')
            .map(tool => ({
              label: tool.name,
              private: tool.private,
              segments: [baseSegment, 'video', tool.key],
              description: tool.description,
            })),
        },
        {
          title: 'Audio',
          links: tools
            .filter(tool => tool.output_type === 'audio')
            .map(tool => ({
              label: tool.name,
              private: tool.private,
              segments: [baseSegment, 'audio', tool.key],
              description: tool.description,
            })),
        },
      ]}
    >
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout
