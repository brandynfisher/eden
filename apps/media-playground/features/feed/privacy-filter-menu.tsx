import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import { FilterIcon, LockIcon, LockOpenIcon } from 'lucide-react'
import { useState } from 'react'

const privacyOptions = [
  { label: 'All', value: 'all' },
  { label: 'Public', value: 'public', icon: <LockOpenIcon /> },
  { label: 'Private', value: 'private', icon: <LockIcon /> },
]

type Props = {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
}

export const PrivacyFilterMenu = ({ onChange, initialFilter }: Props) => {
  const [baseFilter, setBaseFilter] = useState<string>(
    initialFilter?.isPrivate === true
      ? 'private'
      : initialFilter?.isPrivate === false
      ? 'public'
      : 'all',
  )

  const handleFilterChange = (filter: string) => {
    setBaseFilter(filter)
    onChange({
      isPrivate: filter === 'all' ? undefined : filter === 'private',
    })
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 min-w-40 w-full justify-end px-2 py-1.5 h-10 rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <div className="mr-auto text-sm flex items-center">
            {privacyOptions.find(option => option.value === baseFilter)
              ?.label || 'Privacy'}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
          {privacyOptions.map(option => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={option.value === baseFilter}
              onCheckedChange={() => handleFilterChange(option.value)}
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
