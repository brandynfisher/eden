'use client'

import { ToolCardMedia } from '@/components/card/tool-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { getMediaUrl } from '@/features/tools/tools-grid-section'
import { useToolsListQuery } from '@/hooks/query/use-tools-list-query'
import { siteConfig } from '@/lib/config'
import { cn } from '@/lib/utils'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

type Props = {
  currentTool: ToolV2
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ToolSelectorModal = ({ currentTool, open, onOpenChange }: Props) => {
  const { tools } = useToolsListQuery({
    output_type: ['image', 'video', 'audio', 'lora'],
  })
  const router = useRouter()

  const categories = React.useMemo(() => {
    if (!tools) return []

    const eden2Tools = tools.filter(tool => !tool.key.includes('legacy'))
    const legacyTools = tools.filter(tool => tool.key.includes('legacy'))

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
  }, [tools])

  const handleToolSelect = React.useCallback(
    (tool: ToolV2) => {
      // Navigate to the selected tool
      const outputType = tool.key.includes('legacy')
        ? 'legacy'
        : tool.output_type
      router.push(`/create/${outputType}/${tool.key}`)
      onOpenChange(false)
    },
    [router, onOpenChange],
  )

  // Find current tool's category for default tab
  const defaultTab = React.useMemo(() => {
    const currentCategory = categories.find(cat =>
      cat.tools.some(tool => tool.key === currentTool.key),
    )
    return currentCategory?.id || categories[0]?.id || 'featured'
  }, [categories, currentTool.key])

  if (!tools) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <VisuallyHidden>
          <DialogTitle>Select Tool</DialogTitle>
          <DialogDescription>Choose a tool to work with</DialogDescription>
        </VisuallyHidden>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <TypographyH4>Select Tool</TypographyH4>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              {categories.map(category => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  {category.title}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.tools.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {categories.map(category => (
                <TabsContent
                  key={category.id}
                  value={category.id}
                  className="m-0 p-4"
                >
                  <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                    {category.tools.map(tool => (
                      <ToolItem
                        key={tool.key}
                        tool={tool}
                        isActive={tool.key === currentTool.key}
                        onClick={() => handleToolSelect(tool)}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
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
