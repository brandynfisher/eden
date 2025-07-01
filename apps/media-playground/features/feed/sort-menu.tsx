import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  ArrowDownUpIcon,
  ClockArrowDown,
  HeartIcon,
  StarIcon,
} from 'lucide-react'
import { useState } from 'react'

const sortOptions = [
  { label: 'Latest', value: 'createdAt;-1', icon: <ClockArrowDown /> },
  // { label: 'Oldest', value: 'createdAt;1', icon: <ClockArrowUp /> },
]

// Add new sort options specifically for agents
const agentSortOptions = [
  { label: 'Top', value: 'stats.userMessageCount;-1', icon: <StarIcon /> },
  { label: 'Latest', value: 'createdAt;-1', icon: <ClockArrowDown /> },
]

// Add new sort options for users
const userSortOptions = [
  { label: 'Latest', value: 'createdAt;-1', icon: <ClockArrowDown /> },
]

// Add new sort options for creations
const creationSortOptions = [
  { label: 'Top', value: 'likeCount;-1', icon: <HeartIcon /> },
  { label: 'Latest', value: 'createdAt;-1', icon: <ClockArrowDown /> },
]

const modelSortOptions = [
  { label: 'Top', value: 'creationCount;-1', icon: <StarIcon /> },
  { label: 'Latest', value: 'createdAt;-1', icon: <ClockArrowDown /> },
]

// Update the variant type to include 'user' and 'creation'
type Props = {
  onChange: (sort: string) => void
  initialSort?: string
  variant?: 'default' | 'agent' | 'user' | 'creation' | 'model'
  className?: string
}

export const SortMenu = ({
  onChange,
  initialSort,
  variant = 'default',
  className,
}: Props) => {
  const options =
    variant === 'agent'
      ? agentSortOptions
      : variant === 'user'
      ? userSortOptions
      : variant === 'creation'
      ? creationSortOptions
      : variant === 'model'
      ? modelSortOptions
      : sortOptions
  const [baseSort, setBaseSort] = useState<string>(
    initialSort ||
      (variant === 'agent'
        ? 'stats.userMessageCount;-1'
        : variant === 'user'
        ? 'createdAt;-1'
        : variant === 'creation'
        ? 'likeCount;-1'
        : variant === 'model'
        ? 'creationCount;-1'
        : 'createdAt;-1'),
  )

  const handleSortChange = (sort: string) => {
    if (baseSort === sort) return
    setBaseSort(sort)
    onChange(sort)
  }

  return (
    <div
      className={cn('flex items-center flex-grow md:flex-grow-0', className)}
    >
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
          <DropdownMenuLabel>Sort</DropdownMenuLabel>
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
