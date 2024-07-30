'use client'

import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { useGeneratorsListQuery } from '@/hooks/query/use-generators-list-query'
import { PropsWithChildren } from 'react'

const baseSegment = 'train'

const PageLayout = ({ children }: PropsWithChildren) => {
  const { generators } = useGeneratorsListQuery()

  if (!generators) {
    return null
  }

  return (
    <SecondaryNavLayout
      title={'Trainers'}
      baseSegment={baseSegment}
      navigation={[
        {
          title: 'Concept',
          links: generators
            .filter(generator => generator.outputType === 'lora')
            .map(generator => ({
              label: generator.name,
              segments: [baseSegment, generator.key],
            })),
        },
      ]}
      wrapClassName={'!pb-0'}
    >
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout
