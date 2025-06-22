'use client'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { useToolsListQuery } from '@/hooks/query/use-tools-list-query'
import { siteConfig } from '@/lib/config'
import { cn } from '@/lib/utils'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ImageIcon,
  LayersIcon,
  MusicIcon,
  SparklesIcon,
  VideoIcon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useState } from 'react'
import * as React from 'react'

interface ToolItemProps {
  tool: {
    key: string
    name: string
    description: string
    output_type: string
  }
  isActive: boolean
  onItemClick?: () => void
}

const ToolItem: FC<ToolItemProps> = ({ tool, isActive, onItemClick }) => {
  const router = useRouter()

  const handleClick = () => {
    onItemClick?.()
    if (tool.key.includes('legacy')) {
      router.push(`/create/legacy/${tool.key}`)
    } else {
      router.push(`/create/${tool.output_type}/${tool.key}`)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent',
        isActive && 'bg-primary/40 hover:bg-primary/20',
      )}
    >
      <div className="font-medium">{tool.name}</div>
    </button>
  )
}

interface ToolCategoryProps {
  title: string
  icon: React.ReactNode
  tools: {
    key: string
    name: string
    description: string
    output_type: string
  }[]
  currentPath: string
  onItemClick?: () => void
  defaultOpen?: boolean
}

const ToolCategory: FC<ToolCategoryProps> = ({
  title,
  icon,
  tools,
  currentPath,
  onItemClick,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium hover:bg-accent rounded-md">
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? (
          <ChevronDownIcon className="h-4 w-4" />
        ) : (
          <ChevronRightIcon className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1 ml-6">
        {tools.map(tool => (
          <ToolItem
            key={tool.key}
            tool={tool}
            isActive={currentPath.includes(tool.key)}
            onItemClick={onItemClick}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

const ToolsContent: FC<{ onItemClick?: () => void }> = ({ onItemClick }) => {
  const pathname = usePathname()
  const { tools } = useToolsListQuery({
    output_type: ['image', 'video', 'audio', 'lora'],
  })

  if (!tools) {
    return (
      <div className="space-y-2">
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-full h-8" />
      </div>
    )
  }

  const eden2Tools = tools.filter(tool => !tool.key.includes('legacy'))
  const legacyTools = tools.filter(tool => tool.key.includes('legacy'))

  const featuredTools = eden2Tools.filter(tool =>
    siteConfig.featured.tools.includes(tool.key),
  )

  const imageTools = eden2Tools.filter(tool => tool.output_type === 'image')
  const videoTools = eden2Tools.filter(tool => tool.output_type === 'video')
  const audioTools = eden2Tools.filter(tool => tool.output_type === 'audio')
  const modelTools = eden2Tools.filter(tool => tool.output_type === 'lora')

  return (
    <nav className="flex flex-col gap-2 text-sm font-medium pr-2">
      {featuredTools.length > 0 && (
        <ToolCategory
          title="Featured Tools"
          icon={<SparklesIcon className="h-4 w-4" />}
          tools={featuredTools}
          currentPath={pathname}
          onItemClick={onItemClick}
          defaultOpen={true}
        />
      )}

      <ToolCategory
        title="Image"
        icon={<ImageIcon className="h-4 w-4" />}
        tools={imageTools}
        currentPath={pathname}
        onItemClick={onItemClick}
        defaultOpen={true}
      />

      <ToolCategory
        title="Video"
        icon={<VideoIcon className="h-4 w-4" />}
        tools={videoTools}
        currentPath={pathname}
        onItemClick={onItemClick}
        defaultOpen={true}
      />

      <ToolCategory
        title="Model"
        icon={<LayersIcon className="h-4 w-4" />}
        tools={modelTools}
        currentPath={pathname}
        onItemClick={onItemClick}
        defaultOpen={true}
      />

      <ToolCategory
        title="Audio"
        icon={<MusicIcon className="h-4 w-4" />}
        tools={audioTools}
        currentPath={pathname}
        onItemClick={onItemClick}
        defaultOpen={true}
      />

      {legacyTools.length > 0 && (
        <ToolCategory
          title="Classic"
          icon={<LayersIcon className="h-4 w-4" />}
          tools={legacyTools}
          currentPath={pathname}
          onItemClick={onItemClick}
          defaultOpen={false}
        />
      )}
    </nav>
  )
}

export const ToolsSidebarContent: FC<{ onItemClick?: () => void }> = ({
  onItemClick,
}) => {
  return (
    <div className="flex flex-col h-full">
      <ToolsContent onItemClick={onItemClick} />
    </div>
  )
}

export const ToolsSidebar = React.memo(
  ({ onItemClick }: { onItemClick?: () => void }) => {
    return (
      <div className="flex flex-col w-full">
        <ToolsSidebarContent onItemClick={onItemClick} />
      </div>
    )
  },
)
ToolsSidebar.displayName = 'ToolsSidebar'
