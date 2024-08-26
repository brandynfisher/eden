import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EllipsisIcon } from 'lucide-react'
import { PropsWithChildren } from 'react'

const ToolsButton = ({ children }: PropsWithChildren) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex group items-center justify-center cursor-pointer w-8 h-8">
          <EllipsisIcon className="group-hover:text-primary" size={20} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ToolsButton
