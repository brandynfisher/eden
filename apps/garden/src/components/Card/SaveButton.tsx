import { requireAuth } from '@/lib/auth'
import { handleAxiosError } from '@/lib/fetcher'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import BookmarkAddTwoToneIcon from '@mui/icons-material/BookmarkAddTwoTone'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove'
import Bookmarks from '@mui/icons-material/Bookmarks'
import { App } from 'antd'
import axios from 'axios'
import React, { useContext } from 'react'

export const SaveButton = ({
  creation,
  onChange,
}: {
  creation: Creation | Concept
  onChange: (updatedCreation: Creation | Concept) => void
}) => {
  const { isAuthenticated, authenticate } = useContext(UserContext)
  const { message } = App.useApp()
  const { showModal } = useModalContext()

  const onSaveButtonClick = async (
    ev:
      | React.MouseEvent<HTMLAnchorElement, MouseEvent>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    ev.stopPropagation()

    if (!isAuthenticated) {
      await requireAuth(authenticate)
      return
    }

    message.destroy()

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
        message.success(
          {
            content: <SaveButtonMessageContent />,
            key: `add-collection-bookmarks-${creation._id}`,
            onClick: () => {
              message.destroy(`add-collection-bookmarks-${creation._id}`)
              showModal(MODAL_TYPES.COLLECTION_ADD_CREATION_MODAL, {
                creationId: creation._id,
              })
            },
          },
          4,
        )
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
  }

  const { hovered, ref } = useHover()
  return (
    <div
      className={`flex w-10 h-10 items-center justify-end text-black font-mono cursor-pointer ${
        creation.bookmarked ? 'dark:text-gray-300' : 'dark:text-gray-500'
      }`}
      onClick={onSaveButtonClick}
      ref={ref}
      title={creation.bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      <div
        className="text-2xl flex items-center"
        role="img"
        aria-label="Bookmark"
      >
        {creation.bookmarked ? (
          <>
            {hovered ? (
              <BookmarkRemoveIcon fontSize="inherit" />
            ) : (
              <Bookmarks fontSize="inherit" />
            )}
          </>
        ) : (
          <>
            {hovered ? (
              <BookmarkAddTwoToneIcon fontSize="inherit" />
            ) : (
              <BookmarkBorderIcon fontSize="inherit" />
            )}
          </>
        )}
      </div>
    </div>
  )
}

const SaveButtonMessageContent = () => {
  return (
    <div className="block cursor-pointer hover:bg-blend-darken ml-2">
      <div className="flex flex-col items-center justify-between">
        <div className="mb-1">Saved to Bookmarks</div>
        <div className="font-mono text-blue-500">
          Click to change collection
        </div>
      </div>
    </div>
  )
}

export default SaveButton
