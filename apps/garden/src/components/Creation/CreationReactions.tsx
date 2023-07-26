import { requireAuth } from '@/lib/auth'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const PraiseButton = ({
  creation,
  onChange,
}: {
  creation: Creation
  onChange: (updatedCreation: Creation) => void
}) => {
  const { message } = App.useApp()
  const { isAuthenticated, authenticate } = useContext(UserContext)
  const { hovered, ref } = useHover()
  const [isLoading, setIsLoading] = useState(false)

  const onPraiseButtonClick = async () => {
    if (!isAuthenticated) {
      await requireAuth(authenticate)
      return
    }

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

      const newPraiseCount =
        typeof creation.praiseCount !== 'undefined'
          ? creation.praiseCount + (creation.reactions?.praise ? -1 : 1)
          : 0

      onChange({
        ...creation,
        praiseCount: newPraiseCount,
        reactions: {
          ...creation.reactions,
          praise: !creation.reactions?.praise,
        },
      })
    } catch (error) {
      handleAxiosError(error, message)
    }
    setIsLoading(false)
  }

  return (
    <Button
      className={`font-mono flex items-center justify-center rounded-full bg-gray-700 dark:bg-gray-900 text-white border-gray-600 dark:border-gray-700`}
      role="button"
      onClick={onPraiseButtonClick}
      disabled={isLoading}
      loading={isLoading ? { delay: 250 } : false}
      ref={ref}
    >
      <div className="flex" style={{ gap: '8px' }}>
        <div>{creation.praiseCount || 0}</div>
        <div
          role="img"
          aria-label="Raise Hands"
          className={`text-sm ${
            !hovered && !creation.reactions?.praise && 'filter grayscale'
          }`}
        >
          🙌
        </div>
      </div>
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
  const { isAuthenticated, authenticate } = useContext(UserContext)
  const [isLoading, setIsLoading] = useState(false)
  const { message } = App.useApp()

  const onSaveButtonClick = async () => {
    if (!isAuthenticated) {
      await requireAuth(authenticate)
      return
    }

    message.destroy()

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
        message.success({
          content: <SaveButtonMessageContent />,
        })
      }

      const newBookMarkCount =
        typeof creation.bookmarkCount !== 'undefined'
          ? creation.bookmarkCount + (creation.bookmarked ? -1 : 1)
          : 0

      onChange({
        ...creation,
        bookmarkCount: newBookMarkCount,
        bookmarked: !creation.bookmarked,
      })
    } catch (error) {
      handleAxiosError(error, message)
    }
    setIsLoading(false)
  }

  const { hovered, ref } = useHover()
  return (
    <Button
      className={`font-mono flex items-center justify-center rounded-full bg-gray-700 dark:bg-gray-900 text-white border-gray-600 dark:border-gray-700`}
      role="button"
      onClick={onSaveButtonClick}
      disabled={isLoading}
      loading={isLoading ? { delay: 250 } : false}
      ref={ref}
    >
      <div className="flex" style={{ gap: '8px' }}>
        <div>{creation.bookmarkCount || 0}</div>
        <div
          role="img"
          aria-label="Save"
          className={`text-sm relative top-[1px] ${
            !hovered && !creation.bookmarked && 'filter grayscale'
          }`}
        >
          ️⭐️
        </div>
      </div>
    </Button>
  )
}

const SaveButtonMessageContent = () => {
  return (
    <div className="block">
      <div className="flex items-center justify-between">
        <div>Saved to Bookmarks</div>
        {/*<Button*/}
        {/*  type="primary"*/}
        {/*  className="ml-2 rounded-full"*/}
        {/*  onClick={() => {*/}
        {/*    // messageApi.destroy()*/}
        {/*    // setAddToCollectionModalOpen(true)*/}
        {/*  }}*/}
        {/*>*/}
        {/*  Change*/}
        {/*</Button>*/}
      </div>
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
        </div>
      </div>
      <div>
        <SaveButton creation={creation} onChange={onChange} />
      </div>
    </div>
  )
}

export default CreationReactions
