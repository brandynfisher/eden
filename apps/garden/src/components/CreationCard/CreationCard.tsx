import AddToCollectionModal from '@/components/Collections/AddToCollectionModal'
import CreationCardHoverOverlay, {
  CreationCardHoverOverlayProps,
} from '@/components/CreationCard/CreationCardHoverOverlay'
import CreationCardPreview from '@/components/CreationCard/CreationCardPreview'
import CreationDetailModal from '@/components/CreationCard/CreationDetailModal'
import { handleAxiosError } from '@/lib/fetcher'
import { Creation } from '@eden-labs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { Button, message } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React from 'react'

const CreationCard = ({
  index,
  data,
  width,
}: {
  index: number
  data: Creation
  width: number
}) => {
  const router = useRouter()
  const { hovered, ref } = useHover()
  const [preUrl, setPreUrl] = React.useState(router.asPath)
  const [detailModalOpen, setDetailModalOpen] = React.useState(false)
  const [praising, setPraising] = React.useState(false)
  const [burning, setBurning] = React.useState(false)
  const [bookmarking, setBookmarking] = React.useState(false)
  const [creation, setCreation] = React.useState(data)
  const [messageApi, contextHolder] = message.useMessage()
  const [addToCollectionModalOpen, setAddToCollectionModalOpen] =
    React.useState(false)

  const praised = creation.reactions?.praise || false
  const burned = creation.reactions?.burn || false
  const bookmarked = creation.bookmarked || false

  const SaveButtonMessageContent = () => {
    return (
      <div className="flex items-center justify-between">
        <span>Saved to Bookmarks</span>
        <Button
          type="primary"
          className="ml-2 rounded-full"
          onClick={() => {
            messageApi.destroy()
            setAddToCollectionModalOpen(true)
          }}
        >
          Change
        </Button>
      </div>
    )
  }

  const openDetailModal = () => {
    setDetailModalOpen(true)
    setPreUrl(router.asPath)
    router.push('', `/creations/${creation._id}`)
  }

  const onPraiseButtonClick = async () => {
    setPraising(true)
    try {
      if (praised) {
        await axios.post('/api/creations/unreact', {
          creationId: creation._id,
          reaction: 'praise',
        })
      } else {
        await axios.post('/api/creations/react', {
          creationId: creation._id,
          reaction: 'praise',
        })
      }
      setCreation({
        ...creation,
        reactions: {
          ...creation.reactions,
          praise: !praised,
        },
      })
    } catch (error) {
      handleAxiosError(error)
    }
    setPraising(false)
  }

  const onBurnButtonClick = async () => {
    setBurning(true)
    try {
      if (burned) {
        await axios.post('/api/creations/unreact', {
          creationId: creation._id,
          reaction: 'burn',
        })
      } else {
        await axios.post('/api/creations/react', {
          creationId: creation._id,
          reaction: 'burn',
        })
      }
      setCreation({
        ...creation,
        reactions: {
          ...creation.reactions,
          burn: !burned,
        },
      })
    } catch (error) {
      handleAxiosError(error)
    }
    setBurning(false)
  }

  const onSaveButtonClick = async () => {
    setBookmarking(true)
    try {
      if (bookmarked) {
        await axios.post('/api/collections/remove', {
          creationIds: [creation._id],
        })
      } else {
        await axios.post('/api/collections/add', {
          creationIds: [creation._id],
        })
      }
      if (!bookmarked) {
        messageApi.open({
          content: <SaveButtonMessageContent />,
          className: 'custom-class',
        })
      } else {
        messageApi.destroy()
      }
      setCreation({
        ...creation,
        bookmarked: !bookmarked,
      })
    } catch (error) {
      handleAxiosError(error)
    }
    setBookmarking(false)
  }

  const overlayProps: CreationCardHoverOverlayProps = {
    // @ts-ignore: @todo: fix the feed response type
    creatorId: creation.user.userId,
    handlers: {
      onPraiseButtonClick,
      onBurnButtonClick,
      onSaveButtonClick,
      openDetailModal,
    },
    loading: {
      praising,
      burning,
      bookmarking,
    },
    reactions: {
      praised,
      burned,
    },
    bookmarked,
  }

  return (
    <>
      <div className="relative " key={index}>
        <div className="w-full flex justify-center">
          <div
            ref={ref}
            className="relative rounded-lg overflow-hidden cursor-pointer "
          >
            <CreationCardPreview creation={creation} hovered={hovered} />
            {hovered && <CreationCardHoverOverlay {...overlayProps} />}
          </div>
        </div>
      </div>
      <CreationDetailModal
        {...{ open: detailModalOpen, preUrl, setDetailModalOpen }}
        creation={data}
      />
      {false && <p>{width}</p>}
      {contextHolder}
      <AddToCollectionModal
        open={addToCollectionModalOpen}
        setOpen={setAddToCollectionModalOpen}
        creation={creation}
      />
    </>
  )
}

export default CreationCard
