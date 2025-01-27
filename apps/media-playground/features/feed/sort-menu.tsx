import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowDownUpIcon, ClockArrowDown, ClockArrowUp } from 'lucide-react'
import { useState } from 'react'

const sortOptions = [
  { label: 'Latest', value: 'createdAt;-1', icon: <ClockArrowDown /> },
  { label: 'Oldest', value: 'createdAt;1', icon: <ClockArrowUp /> },
]

type Props = {
  onChange: (sort: string) => void
  initialSort?: string
}

export const SortMenu = ({ onChange, initialSort }: Props) => {
  const [baseSort, setBaseSort] = useState<string>(
    initialSort || 'createdAt;-1',
  )

  const handleSortChange = (sort: string) => {
    if (baseSort === sort) return
    setBaseSort(sort)
    onChange(sort)
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 min-w-36 w-full justify-end px-3 py-2 h-9 rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
          <ArrowDownUpIcon className="h-3 w-3 text-muted-foreground" />
          <div className="mr-auto text-sm flex items-center">
            {sortOptions.find(option => option.value === baseSort)?.label ||
              'Sort'}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
          {sortOptions.map(option => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={baseSort === option.value}
              onCheckedChange={() => handleSortChange(option.value)}
            >
              <div className="flex items-center gap-2 [&>svg]:size-3.5">
                {option.icon}
                {option.label}
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
