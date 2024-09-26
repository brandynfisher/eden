import ToggleButton from '@/components/button/toggle-button'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { useTogglePrivacy } from '@/hooks/use-toggle-privacy'
import { cn } from '@/lib/utils'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'

type Props = {
  type: 'creation' | 'model'
  item: ModelV2 | CreationV2
  queryKey: QueryKey
  className?: string
}

const PrivacyToggle = ({ type, item, queryKey, className }: Props) => {
  const { handleToggle } = useTogglePrivacy({ type, item, queryKey })

  return (
    <ToggleGroup
      type="single"
      value={item.public ? 'public' : 'private'}
      className={cn([
        'border border-muted rounded-lg gap-0.5 flex items-center justify-normal bg-popover px-0.5',
        className,
      ])}
      // disabled={isPending}
    >
      <ToggleButton
        value={'public'}
        label={'Public'}
        onClick={handleToggle}
        disabled={item.public}
      />
      <ToggleButton
        value={'private'}
        label={'Private'}
        onClick={handleToggle}
        disabled={!item.public}
      />
    </ToggleGroup>
  )
}

export default PrivacyToggle
