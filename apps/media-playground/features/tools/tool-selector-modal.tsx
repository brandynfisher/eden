'use client'

import { ToolCardMedia } from '@/components/card/tool-card'
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
import { Skeleton } from '@/components/ui/skeleton'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { getMediaUrl } from '@/features/tools/tools-grid-section'
import { useFilteredToolsQuery } from '@/hooks/use-filtered-tools-query'
import { siteConfig } from '@/lib/config'
import { cn } from '@/lib/utils'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
//import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
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

  const handleToolSelect = React.useCallback(
    (tool: ToolV2) => {
      // Navigate to the selected tool
      const outputType = tool.key.includes('legacy')
        ? 'legacy'
        : tool.output_type
      router.push(`/studio/${outputType}/${tool.key}`)
      onOpenChange(false)
    },
    [router, onOpenChange],
  )

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

  if (!tools) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[60vh] p-0 flex flex-col">
        <VisuallyHidden>
          <DialogTitle>Select Tool</DialogTitle>
          <DialogDescription>Choose a tool to work with</DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="p-4 border-b flex-shrink-0 space-y-3">
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
            className="w-full"
            autoFocus={false}
            tabIndex={-1}
          />
        </div>

        {/* Category selector */}
        <div className="px-4 py-3 border-b flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Filter by category</p>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            disabled={!categories.length}
          >
            <SelectTrigger className="w-full sm:w-60">
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
        <div className="flex-1 min-h-0 p-4 overflow-y-auto">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {categories
              .find(category => category.id === selectedCategory)
              ?.tools.map(tool => (
                <ToolItem
                  key={tool.key}
                  tool={tool}
                  isActive={currentToolKey === tool.key}
                  onClick={() => handleToolSelect(tool)}
                />
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type ToolItemProps = {
  tool: ToolV2
  isActive: boolean
  onClick: () => void
}

const ToolItem = ({ tool, isActive, onClick }: ToolItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:bg-muted/50',
        isActive && 'bg-primary/10 border-primary',
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted">
        {tool.thumbnail ? (
          <ToolCardMedia
            variant="thumbnail"
            mediaUrl={getMediaUrl(tool.thumbnail)}
            title={tool.name}
          />
        ) : (
          <Skeleton className="w-full h-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-sm truncate">{tool.name}</h4>
          {tool.base_model && (
            <Badge variant="secondary" className="text-xs ml-2">
              {tool.base_model}
            </Badge>
          )}
        </div>
        {tool.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {tool.description}
          </p>
        )}
      </div>
    </button>
  )
}

export default ToolSelectorModal
