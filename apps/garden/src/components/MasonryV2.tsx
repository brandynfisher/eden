import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/router'

const MasonryV2 = ({
  // type,
  items,
}: {
  // type: 'creations' | 'concepts',
  items: Creation[]
}) => {
  const { showModal } = useModalContext()
  const router = useRouter()

  const handleCardClick = (item: Creation) => {
    showModal(MODAL_TYPES.CREATION_DETAIL_MODAL_V2, {
      initialItem: item,
      usesUrl: true,
      originPageUrl: router.asPath,
    })
  }

  return (
    <div>
      {items.map((item, index) => (
        <CreationCard
          key={item._id}
          index={index}
          data={item}
          onClick={() => handleCardClick(item)}
        />
      ))}
    </div>
  )
}

export default MasonryV2
