import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  ArrowDownUpIcon,
  ClockArrowDown,
  StarIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { useState } from 'react'

const sortOptions = [
  { label: 'Latest', value: 'createdAt;-1', icon: <ClockArrowDown /> },
  // { label: 'Oldest', value: 'createdAt;1', icon: <ClockArrowUp /> },
]

// Add new sort options specifically for agents
const agentSortOptions = [
  {
    label: 'Trending',
    value: 'stats.userCount_7d;-1',
    icon: <TrendingUpIcon />,
  },
  { label: 'Popular', value: 'stats.userCount;-1', icon: <StarIcon /> },
  { label: 'Latest', value: 'createdAt;-1', icon: <ClockArrowDown /> },
]

// Add new sort options for users
const userSortOptions = [
  { label: 'Latest', value: 'createdAt;-1', icon: <ClockArrowDown /> },
]

// Update the variant type to include 'user'
type Props = {
  onChange: (sort: string) => void
  initialSort?: string
  variant?: 'default' | 'agent' | 'user'
}

export const SortMenu = ({
  onChange,
  initialSort,
  variant = 'default',
}: Props) => {
  const options =
    variant === 'agent'
      ? agentSortOptions
      : variant === 'user'
      ? userSortOptions
      : sortOptions
  const [baseSort, setBaseSort] = useState<string>(
    initialSort ||
      (variant === 'agent'
        ? 'stats.userCount_7d;-1'
        : variant === 'user'
        ? 'createdAt;-1'
        : 'createdAt;-1'),
  )

  const handleSortChange = (sort: string) => {
    if (baseSort === sort) return
    setBaseSort(sort)
    onChange(sort)
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 min-w-[168px] w-full md:w-auto justify-end px-2 py-1.5 h-10 rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
          <ArrowDownUpIcon className="h-4 w-4 text-muted-foreground" />
          <Separator orientation="vertical" className="h-4 w-px bg-muted" />
          <div className="mr-auto text-sm flex items-center">
            <div className="mr-2 [&>svg]:size-4">
              {options.find(option => option.value === baseSort)?.icon}
            </div>
            {options.find(option => option.value === baseSort)?.label || 'Sort'}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
          {options.map(option => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={baseSort === option.value}
              onCheckedChange={() => handleSortChange(option.value)}
            >
              <div className="flex items-center gap-2 [&>svg]:size-4">
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
