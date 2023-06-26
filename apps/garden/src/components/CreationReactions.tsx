import { handleAxiosError } from '@/lib/fetcher'
import { Creation } from '@eden-labs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { Button, message } from 'antd'
import axios from 'axios'
import React, { useState } from 'react'

const PraiseButton = ({
  creation,
  onChange,
}: {
  creation: Creation
  onChange: (updatedCreation: Creation) => void
}) => {
  const { hovered, ref } = useHover()
  const [isLoading, setIsLoading] = useState(false)

  const onPraiseButtonClick = async () => {
    setIsLoading(true)
    try {
      if (creation.reactions?.praise) {
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
      onChange({
        ...creation,
        reactions: {
          ...creation.reactions,
          praise: !creation.reactions?.praise,
        },
      })
    } catch (error) {
      handleAxiosError(error)
    }
    setIsLoading(false)
  }

  return (
    <Button
      className={`flex items-center justify-center rounded-l-full`}
      role="button"
      onClick={onPraiseButtonClick}
      disabled={isLoading}
      loading={isLoading ? { delay: 250 } : false}
      ref={ref}
    >
      <span
        role="img"
        aria-label="Raise Hands"
        className={`text-sm ${
          !hovered && !creation.reactions?.praise && 'filter grayscale'
        }`}
      >
        🙌
      </span>
    </Button>
  )
}

const BurnButton = ({
  creation,
  onChange,
}: {
  creation: Creation
  onChange: (updatedCreation: Creation) => void
}) => {
  const { hovered, ref } = useHover()
  const [isLoading, setIsLoading] = useState(false)

  const onBurnButtonClick = async () => {
    setIsLoading(true)
    try {
      if (creation.reactions?.burn) {
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
      onChange({
        ...creation,
        reactions: {
          ...creation.reactions,
          burn: !creation.reactions?.burn,
        },
      })
    } catch (error) {
      handleAxiosError(error)
    }
    setIsLoading(false)
  }

  return (
    <Button
      className={`flex items-center justify-center rounded-r-full`}
      role="button"
      onClick={onBurnButtonClick}
      disabled={isLoading}
      loading={isLoading ? { delay: 250 } : false}
      ref={ref}
    >
      <span
        role="img"
        aria-label="Fire"
        className={`text-sm ${
          !hovered && !creation.reactions?.burn && 'filter grayscale'
        }`}
      >
        🔥
      </span>
    </Button>
  )
}

const SaveButton = ({
  creation,
  onChange,
}: {
  creation: Creation
  onChange: (updatedCreation: Creation) => void
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [messageApi] = message.useMessage()

  const onSaveButtonClick = async () => {
    setIsLoading(true)
    try {
      if (creation.bookmarked) {
        await axios.post('/api/collections/remove', {
          creationIds: [creation._id],
        })
      } else {
        await axios.post('/api/collections/add', {
          creationIds: [creation._id],
        })
      }
      if (!creation.bookmarked) {
        messageApi.open({
          content: <SaveButtonMessageContent />,
          className: 'custom-class',
        })
      } else {
        messageApi.destroy()
      }
      onChange({
        ...creation,
        bookmarked: !creation.bookmarked,
      })
    } catch (error) {
      handleAxiosError(error)
    }
    setIsLoading(false)
  }

  const { hovered, ref } = useHover()
  return (
    <Button
      className={`flex items-center justify-center rounded-full`}
      role="button"
      onClick={onSaveButtonClick}
      disabled={isLoading}
      loading={isLoading ? { delay: 250 } : false}
      ref={ref}
    >
      <span
        role="img"
        aria-label="Save"
        className={`text-sm ${
          !hovered && !creation.bookmarked && 'filter grayscale'
        }`}
      >
        ⭐️
      </span>
    </Button>
  )
}

const SaveButtonMessageContent = () => {
  return (
    <div className="flex items-center justify-between">
      <span>Saved to Bookmarks</span>
      <Button
        type="primary"
        className="ml-2 rounded-full"
        onClick={() => {
          // messageApi.destroy()
          // setAddToCollectionModalOpen(true)
        }}
      >
        Change
      </Button>
    </div>
  )
}

export interface CreationReactionsProps {
  creation: Creation
  onChange: (updatedCreation: Creation) => void
}

const CreationReactions = ({ creation, onChange }: CreationReactionsProps) => {
  return (
    <div className="relative flex justify-between">
      <div>
        <div className="flex">
          <PraiseButton creation={creation} onChange={onChange} />
          <BurnButton creation={creation} onChange={onChange} />
        </div>
      </div>
      <div>
        <SaveButton creation={creation} onChange={onChange} />
      </div>
    </div>
  )
}

export default CreationReactions
