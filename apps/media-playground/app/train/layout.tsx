'use client'

import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { useToolsListQuery } from '@/hooks/query/use-tools-list-query'
import { PropsWithChildren } from 'react'

const baseSegment = 'train'

const PageLayout = ({ children }: PropsWithChildren) => {
  const { generators } = useToolsListQuery({
    output_type: ['lora'],
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
          title: 'Lora',
          links: generators
            .filter(generator => generator.output_type === 'lora')
            .map(generator => ({
              label: generator.name,
              private: generator.private,
              segments: [baseSegment, generator.key],
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
