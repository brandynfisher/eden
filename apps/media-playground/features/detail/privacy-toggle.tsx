import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { fetcher } from '@/lib/fetcher'
import { toast } from 'sonner'

type Props = {
  isPublic: boolean
  type: 'creation' | 'model'
  id: string
  onUpdate: () => void
}

type ToggleButtonProps = {
  value: string
  label: string
  onClick: () => void
}

const ToggleButton = ({ value, label, onClick }: ToggleButtonProps) => {
  return (
    <ToggleGroupItem
      value={value}
      aria-label={`Set ${label}`}
      asChild
      className="px-1 data-[state=on]:bg-muted hover:data-[state=off]:bg-muted/50 data-[state=on]:text-primary data-[state=off]:text-muted-foreground"
    >
      <div
        className={
          'flex items-center gap-1 h-8 w-16 cursor-pointer text-xs rounded-lg justify-center'
        }
        onClick={onClick}
      >
        {label}
      </div>
    </ToggleGroupItem>
  )
}

const PrivacyToggle = ({ isPublic, id, type, onUpdate }: Props) => {
  const onTogglePrivacy = async () => {
    try {
      const response = await fetcher(`/api/${type}s/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          public: !isPublic,
        }),
      })

      if (!response) {
        console.error('response empty')
        return
      }

      onUpdate()

      toast.success(`${type} updated`, {
        description: `set to ${isPublic ? 'private' : 'public'}`,
        dismissible: true,
        richColors: true,
      })
    } catch (e) {
      toast.error(`Update Error`, {
        description: 'Failed to toggle privacy',
        dismissible: true,
        richColors: true,
      })
    }
  }

  return (
    <ToggleGroup
      type="single"
      value={isPublic ? 'public' : 'private'}
      className="border border-muted rounded-lg p-1 flex items-center justify-normal max-w-fit bg-popover"
    >
      <ToggleButton
        value={'public'}
        label={'Public'}
        onClick={onTogglePrivacy}
      />
      <ToggleButton
        value={'private'}
        label={'Private'}
        onClick={onTogglePrivacy}
      />
    </ToggleGroup>
  )
}

export default PrivacyToggle
