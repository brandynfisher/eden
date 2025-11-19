'use client'

import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFilteredToolsQuery } from '@/hooks/use-filtered-tools-query'
import { siteConfig } from '@/lib/config'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

type ToolsFilterProps = {
  initialCategory: string
  onChange: (category: string) => void
  className?: string
}

export const ToolsFilter = ({
  initialCategory,
  onChange,
  className,
}: ToolsFilterProps) => {
  const { tools } = useFilteredToolsQuery({
    output_type: ['image', 'video', 'audio', 'lora'],
  })

  const categories = useMemo(() => {
    const baseCategories = [
      { value: 'featured', label: 'Featured' },
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Video' },
      { value: 'lora', label: 'Training' },
      { value: 'audio', label: 'Audio' },
      { value: 'classic', label: 'Classic' },
    ]

    if (!tools) {
      return baseCategories.map(category => ({ ...category, count: undefined }))
    }

    const getCount = (categoryValue: string) => {
      switch (categoryValue) {
        case 'featured':
          return tools.filter(tool =>
            siteConfig.featured.tools.includes(tool.key),
          ).length
        case 'image':
          return tools.filter(
            tool =>
              tool.output_type === 'image' && !tool.key.includes('legacy'),
          ).length
        case 'video':
          return tools.filter(
            tool =>
              tool.output_type === 'video' && !tool.key.includes('legacy'),
          ).length
        case 'audio':
          return tools.filter(
            tool =>
              tool.output_type === 'audio' && !tool.key.includes('legacy'),
          ).length
        case 'lora':
          return tools.filter(tool => tool.output_type === 'lora').length
        case 'classic':
          return tools.filter(
            tool =>
              tool.key.includes('legacy') &&
              (tool.output_type === 'image' || tool.output_type === 'video'),
          ).length
        default:
          return tools.length
      }
    }

    return baseCategories.map(category => ({
      ...category,
      count: getCount(category.value),
    }))
  }, [tools])

  return (
    <div className={cn('w-full', className)}>
      <Select value={initialCategory} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-60">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map(category => (
            <SelectItem key={category.value} value={category.value}>
              <div className="flex items-center justify-between w-full gap-4">
                <span>{category.label}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {typeof category.count === 'number' ? category.count : '--'}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
