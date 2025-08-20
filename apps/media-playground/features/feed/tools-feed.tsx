'use client'

import ToolCard from '@/components/card/tool-card'
import { useFilteredToolsQuery } from '@/hooks/use-filtered-tools-query'
import { siteConfig } from '@/lib/config'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { useMemo } from 'react'

type ToolsFeedProps = {
  category: string
  searchQuery?: string
}

export const getMediaUrl = (mediaFileName: string) => {
  return `https://d14i3advvh2bvd.cloudfront.net/${mediaFileName}`
}

const ToolsFeed = ({ category, searchQuery }: ToolsFeedProps) => {
  const { tools } = useFilteredToolsQuery({
    output_type: ['image', 'video', 'audio', 'lora'],
  })

  const filteredTools = useMemo(() => {
    if (!tools) return []

    let categoryTools: ToolV2[] = []

    // Filter by category
    switch (category) {
      case 'featured':
        categoryTools = tools.filter(tool =>
          siteConfig.featured.tools.includes(tool.key),
        )
        break
      case 'image':
        categoryTools = tools.filter(
          tool => tool.output_type === 'image' && !tool.key.includes('legacy'),
        )
        break
      case 'video':
        categoryTools = tools.filter(
          tool => tool.output_type === 'video' && !tool.key.includes('legacy'),
        )
        break
      case 'audio':
        categoryTools = tools.filter(
          tool => tool.output_type === 'audio' && !tool.key.includes('legacy'),
        )
        break
      case 'lora':
        categoryTools = tools.filter(tool => tool.output_type === 'lora')
        break
      case 'classic':
        categoryTools = tools.filter(
          tool =>
            tool.key.includes('legacy') &&
            (tool.output_type === 'image' || tool.output_type === 'video'),
        )
        break
      default:
        categoryTools = tools
    }

    // Apply search filter if provided (search across all tools, not just category)
    if (searchQuery && searchQuery.trim()) {
      const searchTerms = searchQuery.toLowerCase().trim()
      return tools.filter(
        tool =>
          tool.name.toLowerCase().includes(searchTerms) ||
          tool.description?.toLowerCase().includes(searchTerms) ||
          tool.key.toLowerCase().includes(searchTerms),
      )
    }

    return categoryTools
  }, [tools, category, searchQuery])

  if (!tools) {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
      {filteredTools.length > 0 ? (
        filteredTools.map(tool => (
          <ToolCard
            key={tool.key}
            title={tool.name}
            description={tool.description}
            image={getMediaUrl(tool.thumbnail || '')}
            link={`/${
              tool.output_type === 'lora'
                ? 'train'
                : `create/${tool.output_type}`
            }/${tool.key}`}
            priority={category === 'featured'}
          />
        ))
      ) : (
        <div className="col-span-full text-center text-muted-foreground py-8">
          {searchQuery
            ? 'No tools found matching your search.'
            : 'No tools found in this category.'}
        </div>
      )}
    </div>
  )
}

export default ToolsFeed
