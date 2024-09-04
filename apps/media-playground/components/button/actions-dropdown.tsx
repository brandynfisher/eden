import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { EllipsisIcon } from 'lucide-react'
import { PropsWithChildren } from 'react'

type Props = {
  className?: string
} & PropsWithChildren

const ActionsDropdown = ({ children, className }: Props) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={cn([
            `flex group items-center justify-center cursor-pointer w-8 h-8`,
            className,
          ])}
        >
          <EllipsisIcon className="group-hover:text-primary" size={20} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {/*<DropdownMenuLabel>Actions</DropdownMenuLabel>*/}
        {/*<DropdownMenuSeparator />*/}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ActionsDropdown
