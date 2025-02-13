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
import { cn } from '@/lib/utils'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import { FilterIcon } from 'lucide-react'
import { ReactNode, useMemo, useState } from 'react'

export interface FilterSection {
  id: keyof FeedCursorRouteQueryParams['filter']
  label: string
  items: {
    id: string
    name: string
    icon?: ReactNode
  }[]
  canHaveMultipleValues: boolean
}

interface BaseFilterProps {
  sections: FilterSection[]
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
}

export function BaseFilter({
  sections,
  onChange,
  initialFilter,
}: BaseFilterProps) {
  const [baseFilter, setBaseFilter] = useState<
    FeedCursorRouteQueryParams['filter']
  >(initialFilter || {})

  const numberOfFilters = useMemo(() => {
    return Object.values(baseFilter || {}).reduce((acc: number, val) => {
      if (Array.isArray(val)) return acc + val.length
      if (val) return acc + 1
      return acc
    }, 0)
  }, [baseFilter])

  const handleItemChange = (
    sectionId: string,
    itemId: string,
    canHaveMultipleValues?: boolean,
  ) => {
    const currentValue = baseFilter?.[sectionId as keyof typeof baseFilter]
    let newValue: string | string[]

    if (!canHaveMultipleValues) {
      // Handle collection as a single string value
      newValue = currentValue === itemId ? '' : itemId
    } else {
      // Handle other fields as arrays
      const currentItems = (currentValue as string[]) || []
      if (currentItems.includes(itemId)) {
        newValue = currentItems.filter(item => item !== itemId)
      } else {
        newValue = [...currentItems, itemId]
      }
    }

    const newFilter = {
      ...baseFilter,
      [sectionId]: newValue,
    } as typeof baseFilter

    setBaseFilter(newFilter)
    onChange(newFilter)
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center gap-2 min-w-40 w-full justify-end pl-2 pr-1 py-1.5 h-10 rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
            numberOfFilters > 0 && 'border-purple-600',
          )}
        >
          <FilterIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="mr-auto text-sm flex items-center w-full">
            Filter{' '}
            {numberOfFilters > 0 && (
              <span className="ml-auto min-w-5 text-xs p-1 bg-secondary/50 rounded-md">
                {numberOfFilters}
              </span>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
          <ScrollArea className="max-h-80 overflow-y-auto">
            {sections.map((section, index) => (
              <div key={section.id}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
                  {section.items.map(item => (
                    <DropdownMenuCheckboxItem
                      key={item.id}
                      checked={
                        !section.canHaveMultipleValues
                          ? baseFilter?.[section.id] === item.id
                          : (
                              baseFilter?.[section.id] as string[] | undefined
                            )?.includes(item.id) ?? false
                      }
                      onCheckedChange={() =>
                        handleItemChange(
                          section.id,
                          item.id,
                          section.canHaveMultipleValues,
                        )
                      }
                      onSelect={e => e.preventDefault()}
                    >
                      <div className="flex items-center">
                        {item.icon && (
                          <span className="mr-2 h-4 w-4">{item.icon}</span>
                        )}
                        {item.name}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </div>
            ))}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
