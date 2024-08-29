import { ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

type ToggleButtonProps = {
  value: string
  label: string
  onClick: () => void
  className?: string
}

const ToggleButton = ({
  value,
  label,
  onClick,
  className,
}: ToggleButtonProps) => {
  return (
    <ToggleGroupItem
      value={value}
      aria-label={`Set ${label}`}
      asChild
      className="px-1 data-[state=on]:bg-muted hover:data-[state=off]:bg-muted/50 data-[state=on]:text-primary data-[state=off]:text-muted-foreground"
    >
      <div
        className={cn([
          `'flex items-center gap-1 h-8 w-16 cursor-pointer text-xs rounded-lg justify-center'`,
          className,
        ])}
        onClick={onClick}
      >
        {label}
      </div>
    </ToggleGroupItem>
  )
}

export default ToggleButton
