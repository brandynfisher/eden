import CircleButton from '@/components/Layout/buttons/CircleButton'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import LibraryAdd from '@mui/icons-material/LibraryAdd'

const AddToCollectionButton = ({
  itemId,
  // itemType,
  variant,
  label,
}: {
  itemId: string
  // itemType: 'creation' | 'concept'
  variant?: 'text'
  label?: string
}) => {
  const { showModal } = useModalContext()

  const onClick = async () => {
    showModal(MODAL_TYPES.COLLECTION_ADD_CREATION_MODAL, {
      creationId: itemId,
    })
    // onChange && onChange({ isPrivate: false })
  }

  if (variant === 'text') {
    return (
      <div
        onClick={() => onClick()}
        className="flex items-center gap-2 w-full justify-between"
        title={`Add to Collection`}
      >
        <div>{label}</div>
        <LibraryAdd fontSize="small" />
      </div>
    )
  }

  return (
    <CircleButton
      title={`Add to Collection`}
      icon={<LibraryAdd fontSize="medium" />}
      onClick={() => onClick()}
    />
  )
}

export default AddToCollectionButton
