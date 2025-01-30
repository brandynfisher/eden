import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import { FilterIcon, ImageIcon, StarIcon, VideoIcon } from 'lucide-react'
import React from 'react'
import { useMemo, useState } from 'react'

const tools = [
  { id: 'flux_dev', name: 'Flux DEV' },
  { id: 'flux_schnell', name: 'Flux Schnell' },
  { id: 'upscaler', name: 'Upscaler' },
  { id: 'txt2img', name: 'txt2img' },
  { id: 'txt2vid', name: 'txt2vid' },
  { id: 'img2vid', name: 'img2vid' },
  { id: 'texture_flow', name: 'Texture Flow' },
  { id: 'animate_3D', name: 'Animate 3D' },
  { id: 'runway', name: 'Runway' },
  { id: 'style_mixing', name: 'Style Mixing' },
  { id: 'style_transfer', name: 'Style Transfer' },
  { id: 'face_styler', name: 'Face Styler' },
]

type Props = {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
}

export const CreationsFilter = ({ onChange, initialFilter }: Props) => {
  const [baseFilter, setBaseFilter] = useState<
    FeedCursorRouteQueryParams['filter']
  >(
    initialFilter || {
      output_type: [],
      tool: [],
    },
  )

  const numberOfFilters = useMemo(() => {
    return (
      (baseFilter?.collection ? 1 : 0) +
      (baseFilter?.tool?.length || 0) +
      (baseFilter?.output_type?.length || 0)
    )
  }, [baseFilter])

  const handleFilterChange = (filter: FeedCursorRouteQueryParams['filter']) => {
    onChange(filter)
  }

  const handleSelectFeatured = () => {
    const newFilter = {
      ...baseFilter,
      collection: baseFilter?.collection
        ? ''
        : process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID || '',
    }
    setBaseFilter(newFilter)
    handleFilterChange(newFilter)
  }

  const handleTypeChange = (type: 'image' | 'video') => {
    let newOutputType = baseFilter?.output_type || []
    if (newOutputType.includes(type)) {
      newOutputType = newOutputType.filter(t => t !== type)
    } else {
      newOutputType.push(type)
    }
    const newFilter = {
      ...baseFilter,
      output_type: newOutputType,
    }
    setBaseFilter(newFilter)
    handleFilterChange(newFilter)
  }

  const handleToolChange = (tool: string) => {
    let newTool = baseFilter?.tool || []
    if (newTool.includes(tool)) {
      newTool = newTool.filter(t => t !== tool)
    } else {
      newTool.push(tool)
    }
    const newFilter = {
      ...baseFilter,
      tool: newTool,
    }
    setBaseFilter(newFilter)
    handleFilterChange(newFilter)
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 min-w-36 w-full justify-end px-2 py-1.5 h-9 rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <div className="mr-auto text-sm flex items-center">
            Filter {numberOfFilters > 0 && `(${numberOfFilters})`}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
          <ScrollArea className="h-80">
            <DropdownMenuCheckboxItem
              checked={!!baseFilter?.collection}
              onSelect={handleSelectFeatured}
            >
              <div className="flex items-center">
                <StarIcon className="h-3 w-3 mr-2" />
                Featured
              </div>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Type</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={baseFilter?.output_type?.includes('image')}
                onCheckedChange={() => handleTypeChange('image')}
                onSelect={e => e.preventDefault()}
              >
                <div className="flex items-center">
                  <ImageIcon className="h-3 w-3 mr-2" />
                  Image
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={baseFilter?.output_type?.includes('video')}
                onCheckedChange={() => handleTypeChange('video')}
                onSelect={e => e.preventDefault()}
              >
                <div className="flex items-center">
                  <VideoIcon className="h-3 w-3 mr-2" />
                  Video
                </div>
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tool</DropdownMenuLabel>
              {tools.map(tool => (
                <DropdownMenuCheckboxItem
                  key={tool.id}
                  checked={baseFilter?.tool?.includes(tool.id)}
                  onCheckedChange={() => handleToolChange(tool.id)}
                  onSelect={e => e.preventDefault()}
                >
                  <div className="flex items-center">{tool.name}</div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
