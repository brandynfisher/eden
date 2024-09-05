import ToggleButton from '@/components/button/toggle-button'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { useTogglePrivacy } from '@/hooks/use-toggle-privacy'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'

type Props = {
  type: 'creation' | 'model'
  item: ModelV2 | CreationV2
  onUpdate: () => void
}

const PrivacyToggle = ({ type, item, onUpdate }: Props) => {
  const { handleToggle } = useTogglePrivacy({ type, item, onUpdate })

  return (
    <ToggleGroup
      type="single"
      value={item.public ? 'public' : 'private'}
      className="border border-muted rounded-lg p-1 flex items-center justify-normal max-w-fit bg-popover"
    >
      <ToggleButton value={'public'} label={'Public'} onClick={handleToggle} />
      <ToggleButton
        value={'private'}
        label={'Private'}
        onClick={handleToggle}
      />
    </ToggleGroup>
  )
}

export default PrivacyToggle
