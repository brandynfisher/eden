import SaveButton from '@/components/Card/SaveButton'
import { requireAuth } from '@/lib/auth'
import { handleAxiosError } from '@/lib/fetcher'
import { ItemType } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined'
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone'
import { App } from 'antd'
import axios from 'axios'
import React, { useContext } from 'react'

import { CardData } from './Card'

export const PraiseButton = ({
  item,
  itemType,
  onChange,
  showCounts,
}: {
  item: CardData
  itemType: ItemType
  onChange: (updatedData: CardData) => void
  showCounts?: boolean
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

    const reactionData = {
      id: item._id,
      reaction: 'praise',
    }

    try {
      if (item.reactions?.praise) {
        await axios.post(`/api/${itemType}s/unreact`, {
          ...reactionData,
        })
      } else {
        await axios.post(`/api/${itemType}s/react`, {
          ...reactionData,
        })
      }

      const newPraiseCount =
        typeof item.praiseCount !== 'undefined'
          ? item.praiseCount + (item.reactions?.praise ? -1 : 1)
          : 0

      onChange({
        ...item,
        praiseCount: newPraiseCount,
        reactions: {
          ...item.reactions,
          praise: !item.reactions?.praise,
        },
      })
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  return (
    <div
      className={`flex items-center justify-start w-10 h-10 cursor-pointer font-mono`}
      role="button"
      onClick={onPraiseButtonClick}
      ref={ref}
    >
      <div
        className={`flex gap-2 items-center ${
          item.reactions?.praise ? 'dark:text-gray-300' : 'dark:text-gray-500'
        }`}
      >
        <div
          className="text-2xl flex items-center"
          role="img"
          aria-label="Like"
        >
          {item.reactions?.praise ? (
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
        {showCounts ? <div>{item.praiseCount || 0}</div> : null}
      </div>
    </div>
  )
}

export interface CardReactionProps {
  item: CardData
  itemType: ItemType
  onChange: (updatedData: CardData) => void
  showCounts?: boolean
}

const CreationReactions = ({
  item,
  onChange,
  showCounts,
}: {
  item: Creation
  onChange: (updatedData: CardData) => void
  showCounts?: boolean
}) => {
  return (
    <>
      <div>
        <div className="flex pointer-events-auto">
          <PraiseButton
            item={item}
            itemType={'creation'}
            onChange={onChange}
            showCounts={showCounts}
          />
        </div>
      </div>
      <div className="pointer-events-auto">
        <SaveButton creation={item} onChange={onChange} />
      </div>
    </>
  )
}

const CardReactions = ({
  item,
  itemType,
  onChange,
  showCounts,
}: CardReactionProps) => {
  return itemType === 'creation' ? (
    <div className="relative flex justify-between">
      {itemType === 'creation' ? (
        <CreationReactions
          item={item as Creation}
          onChange={onChange}
          showCounts={showCounts}
        />
      ) : null}
    </div>
  ) : (
    <div className="relative hidden md:flex justify-between">
      <div className="h-2">
        <div className="flex pointer-events-auto">
          {/*      <PraiseButton*/}
          {/*        item={conceptData}*/}
          {/*        type={'concept'}*/}
          {/*        onChange={*/}
          {/*          setConceptData as Dispatch<*/}
          {/*            SetStateAction<Concept | Creation>*/}
          {/*          >*/}
          {/*        }*/}
          {/*        showCounts={true}*/}
          {/*      />*/}
        </div>
      </div>
    </div>
  )
}

export default CardReactions
