'use client'

import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { useToolsListQuery } from '@/hooks/query/use-tools-list-query'
import { PropsWithChildren } from 'react'

const baseSegment = 'train'

const PageLayout = ({ children }: PropsWithChildren) => {
  const { tools } = useToolsListQuery({
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
              status: tool.status,
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
