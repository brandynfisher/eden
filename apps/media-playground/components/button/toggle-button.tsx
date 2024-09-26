import { ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

type ToggleButtonProps = {
  value: string
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
}

const ToggleButton = ({
  value,
  label,
  onClick,
  className,
  disabled,
}: ToggleButtonProps) => {
  return (
    <ToggleGroupItem
      value={value}
      aria-label={`Set ${label}`}
      onClick={!disabled ? onClick : undefined}
      className={cn([
        'flex items-center h-7 w-16 text-xs rounded-md justify-center data-[disabled]:text-accent-foreground',
        disabled
          ? 'cursor-auto !bg-muted'
          : 'hover:!bg-accent hover:!text-primary',
        className,
      ])}
    >
      {label}
    </ToggleGroupItem>
  )
}

export default ToggleButton
