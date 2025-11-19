'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

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
  const categories = [
    { value: 'featured', label: 'Featured' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'lora', label: 'Training' },
    { value: 'audio', label: 'Audio' },
    { value: 'classic', label: 'Classic' },
  ]

  return (
    <Tabs
      value={initialCategory}
      onValueChange={onChange}
      className={cn('min-w-0 w-full', className)}
    >
      <TabsList className="flex min-w-0 w-full gap-1 overflow-x-auto rounded-xl bg-muted/40 p-1">
        {categories.map(category => (
          <TabsTrigger
            key={category.value}
            value={category.value}
            className="w-full text-xs px-2 lg:px-3 lg:text-sm"
          >
            {category.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
