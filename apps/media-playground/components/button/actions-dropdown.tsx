import { Button } from '@/components/ui/button'
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
  onOpenChange?: (open: boolean) => void
} & PropsWithChildren

const ActionsDropdown = ({ children, className, onOpenChange }: Props) => {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn([
            `flex group items-center justify-center cursor-pointer w-9 h-9 p-2`,
            className,
          ])}
        >
          <EllipsisIcon className="group-hover:text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ActionsDropdown
