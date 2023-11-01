import { requireAuth } from '@/lib/auth'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import BookmarkAddTwoToneIcon from '@mui/icons-material/BookmarkAddTwoTone'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove'
import Bookmarks from '@mui/icons-material/Bookmarks'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined'
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone'
import { App } from 'antd'
import axios from 'axios'
import React, { useContext } from 'react'

const PraiseButton = ({
  creation,
  onChange,
}: {
  creation: Creation | Concept
  onChange: (updatedCreation: Creation | Concept) => void
}) => {
  const { message } = App.useApp()
  const { isAuthenticated, authenticate } = useContext(UserContext)
  const { hovered, ref } = useHover()

  const onPraiseButtonClick = async (
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
  }

  return (
    <div
      className={`flex items-center justify-center w-10 h-10 text-black dark:text-white cursor-pointer font-mono`}
      role="button"
      onClick={onPraiseButtonClick}
      ref={ref}
    >
      <div className="flex gap-2 items-center">
        <div
          className="text-2xl flex items-center"
          role="img"
          aria-label="Like"
        >
          {creation.reactions?.praise ? (
            <>
              {hovered ? (
                <FavoriteOutlinedIcon fontSize="inherit" />
              ) : (
                <FavoriteOutlinedIcon fontSize="inherit" />
              )}
            </>
          ) : (
            <>
              {hovered ? (
                <FavoriteTwoToneIcon fontSize="inherit" />
              ) : (
                <FavoriteBorderIcon fontSize="inherit" />
              )}
            </>
          )}
        </div>
        <div>{creation.praiseCount || 0}</div>
      </div>
    </div>
  )
}

const SaveButton = ({
  creation,
  onChange,
}: {
  creation: Creation | Concept
  onChange: (updatedCreation: Creation | Concept) => void
}) => {
  const { isAuthenticated, authenticate } = useContext(UserContext)
  const { message } = App.useApp()

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
  }

  const { hovered, ref } = useHover()
  return (
    <div
      className={`flex w-10 h-10 items-center justify-end text-black dark:text-white font-mono cursor-pointer`}
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
    <div className="block">
      <div className="flex items-center justify-between">
        <div>Saved to Bookmarks</div>
      </div>
    </div>
  )
}

export interface CreationReactionsProps {
  creation: Creation | Concept
  onChange: (updatedCreation: Creation | Concept) => void
}

const CreationReactions = ({ creation, onChange }: CreationReactionsProps) => {
  return (
    <div className="relative flex justify-between">
      <div>
        <div className="flex pointer-events-auto">
          <PraiseButton creation={creation} onChange={onChange} />
        </div>
      </div>
      <div className="pointer-events-auto">
        <SaveButton creation={creation} onChange={onChange} />
      </div>
    </div>
  )
}

export default CreationReactions
