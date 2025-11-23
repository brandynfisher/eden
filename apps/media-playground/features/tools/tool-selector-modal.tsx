'use client'

import ToolCard from '@/components/card/tool-card'
import { Badge } from '@/components/ui/badge'
//import { Button } from '@/components/ui/button'
import {
  Dialog, //DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { getMediaUrl } from '@/features/tools/tools-grid-section'
import { useFilteredToolsQuery } from '@/hooks/use-filtered-tools-query'
import { siteConfig } from '@/lib/config'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
//import { X } from 'lucide-react'
import * as React from 'react'

type Props = {
  currentTool?: ToolV2 | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ToolSelectorModal = ({ currentTool, open, onOpenChange }: Props) => {
  const { tools } = useFilteredToolsQuery({
    output_type: ['image', 'video', 'audio', 'lora'],
  })
  const [searchQuery, setSearchQuery] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filteredTools = React.useMemo(() => {
    if (!tools || !searchQuery.trim()) return tools

    const query = searchQuery.toLowerCase().trim()
    return tools.filter(
      tool =>
        tool.name.toLowerCase().includes(query) ||
        (tool.description && tool.description.toLowerCase().includes(query)),
    )
  }, [tools, searchQuery])

  const categories = React.useMemo(() => {
    if (!filteredTools) return []

    const eden2Tools = filteredTools.filter(
      tool => !tool.key.includes('legacy'),
    )
    const legacyTools = filteredTools.filter(tool =>
      tool.key.includes('legacy'),
    )

    // Get featured tools
    const featuredTools = eden2Tools.filter(tool =>
      siteConfig.featured.tools.includes(tool.key),
    )

    // Create categories with tools
    return [
      {
        id: 'featured',
        title: 'Featured',
        tools: featuredTools,
      },
      {
        id: 'image',
        title: 'Image',
        tools: eden2Tools.filter(tool => tool.output_type === 'image'),
      },
      {
        id: 'video',
        title: 'Video',
        tools: eden2Tools.filter(tool => tool.output_type === 'video'),
      },
      {
        id: 'lora',
        title: 'Model',
        tools: eden2Tools.filter(tool => tool.output_type === 'lora'),
      },
      {
        id: 'audio',
        title: 'Audio',
        tools: eden2Tools.filter(tool => tool.output_type === 'audio'),
      },
      {
        id: 'classic',
        title: 'Classic',
        tools: legacyTools,
      },
    ].filter(category => category.tools.length > 0)
  }, [filteredTools])

  // Find current tool's category for default selection
  const currentToolKey = currentTool?.key
  const defaultCategoryId = React.useMemo(() => {
    if (!categories.length) {
      return 'featured'
    }

    if (!currentToolKey) {
      return categories[0]?.id || 'featured'
    }

    const currentCategory = categories.find(cat =>
      cat.tools.some(tool => tool.key === currentToolKey),
    )
    return currentCategory?.id || categories[0]?.id || 'featured'
  }, [categories, currentToolKey])

  const [selectedCategory, setSelectedCategory] = React.useState<string>('')

  React.useEffect(() => {
    if (!categories.length) {
      setSelectedCategory('')
      return
    }

    setSelectedCategory(prev => {
      const hasPrev = categories.some(cat => cat.id === prev)
      if (prev && hasPrev) {
        return prev
      }
      return defaultCategoryId
    })
  }, [categories, defaultCategoryId])

  // Prevent autofocus on mobile by blurring the input after a brief delay
  React.useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.blur()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const buildToolLink = React.useCallback((tool: ToolV2) => {
    const outputType = tool.key.includes('legacy') ? 'legacy' : tool.output_type
    return `/studio/${outputType}/${tool.key}`
  }, [])

  const selectedCategoryData = React.useMemo(
    () => categories.find(category => category.id === selectedCategory),
    [categories, selectedCategory],
  )

  const selectedTools = selectedCategoryData?.tools ?? []

  if (!tools) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(1200px,95vw)] max-w-[1200px] h-[85vh] p-0 flex flex-col overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Select Tool</DialogTitle>
          <DialogDescription>Choose a tool to work with</DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="p-6 border-b flex-shrink-0 space-y-4 bg-background">
          <div className="flex items-center justify-between">
            <TypographyH4>Select Tool</TypographyH4>
            {/* <DialogClose asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose> */}
          </div>
          <Input
            ref={inputRef}
            placeholder="Search tools..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11"
            autoFocus={false}
            tabIndex={-1}
          />
        </div>

        {/* Category selector */}
        <div className="px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-background">
          <p className="text-sm text-muted-foreground">Filter by category</p>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            disabled={!categories.length}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span>{category.title}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {category.tools.length}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category content */}
        <div className="flex-1 min-h-0 px-6 pb-6 pt-4 overflow-hidden bg-background">
          <div className="h-full overflow-y-auto pr-1">
            {selectedTools.length ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {selectedTools.map(tool => (
                  <ToolCard
                    key={tool.key}
                    title={tool.name}
                    description={tool.description}
                    image={getMediaUrl(tool.thumbnail || '')}
                    link={buildToolLink(tool)}
                    outputType={tool.output_type}
                    priority={selectedCategory === 'featured'}
                    isActive={currentToolKey === tool.key}
                    onClick={() => onOpenChange(false)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No tools found in this category.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ToolSelectorModal
