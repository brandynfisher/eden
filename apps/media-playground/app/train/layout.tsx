'use client'

import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { useFilteredToolsQuery } from '@/hooks/use-filtered-tools-query'
import { PropsWithChildren } from 'react'

const baseSegment = 'train'

const PageLayout = ({ children }: PropsWithChildren) => {
  const { tools } = useFilteredToolsQuery({
    output_type: ['lora'],
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
          title: 'Lora',
          links: tools
            .filter(tool => tool.output_type === 'lora')
            .map(tool => ({
              label: tool.name,
              mediaUrl: tool.thumbnail,
              segments: [baseSegment, tool.key],
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
