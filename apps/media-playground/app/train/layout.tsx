'use client'

import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { useGeneratorsListQuery } from '@/hooks/query/use-generators-list-query'
import { PropsWithChildren } from 'react'

const baseSegment = 'train'

const PageLayout = ({ children }: PropsWithChildren) => {
  const { generators } = useGeneratorsListQuery({
    outputType: ['lora'],
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
            .filter(generator => generator.outputType === 'lora')
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
