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

  const eden2Tools = tools.filter(tool => !tool.key.includes('legacy'))

  // Helper function to create navigation items
  const createNavigationItem = (title: string, outputType: string) => ({
    title,
    links: eden2Tools
      .filter(tool => tool.output_type === outputType)
      .map(tool => ({
        label: tool.name,
        private: tool.private,
        segments: [baseSegment, outputType, tool.key],
        description: tool.description,
      })),
  })

  const navigation = [
    createNavigationItem('Image', 'image'),
    createNavigationItem('Video', 'video'),
    createNavigationItem('Audio', 'audio'),
  ]

  return (
    <SecondaryNavLayout
      title={'Tools'}
      wrapClassName={'!pb-0'}
      baseSegment={baseSegment}
      navigation={navigation}
    >
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout
