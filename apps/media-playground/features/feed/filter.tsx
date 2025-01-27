import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import { FilterIcon } from 'lucide-react'
import { ReactNode, useState } from 'react'

type Props = {
  options: {
    label: string
    icon: ReactNode
    value: FeedCursorRouteQueryParams['filter'] // Use the filter type directly here
  }[]
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
}

export const Filter = ({ options, onChange }: Props) => {
  const [selectedValue, setSelectedValue] = useState(options[0])

  const handleFilterChange = (option: (typeof options)[0]) => {
    setSelectedValue(option)
    onChange(option.value)
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 min-w-36 justify-end px-3 py-2 h-9 rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
          <FilterIcon className="h-3 w-3 text-muted-foreground" />
          <Separator orientation="vertical" />
          <div className="mr-auto">{selectedValue.label}</div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
          {options.map((option, index) => (
            <DropdownMenuItem
              key={`${option.value}_${index}`}
              onClick={() => handleFilterChange(option)}
            >
              <div className="flex items-center">
                {option.icon}
                {option.label}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
