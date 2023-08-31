import { requireAuth } from '@/lib/auth'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Concept } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined'
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const PraiseButton = ({
  concept,
  onChange,
}: {
  concept: Concept
  onChange: (updatedConcept: Concept) => void
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
      if (concept.reactions?.praise) {
        await axios.post('/api/concepts/unreact', {
          conceptId: concept._id,
          reaction: 'praise',
        })
      } else {
        await axios.post('/api/concepts/react', {
          conceptId: concept._id,
          reaction: 'praise',
        })
      }

      const newPraiseCount =
        typeof concept.praiseCount !== 'undefined'
          ? concept.praiseCount + (concept.reactions?.praise ? -1 : 1)
          : 0

      onChange({
        ...concept,
        praiseCount: newPraiseCount,
        reactions: {
          ...concept.reactions,
          praise: !concept.reactions?.praise,
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
      <div className="flex items-center" style={{ gap: '8px' }}>
        <div className="text-white">{concept.praiseCount || 0}</div>
        <div className="text-lg flex items-center" role="img" aria-label="Like">
          {concept.reactions?.praise ? (
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
      </div>
    </Button>
  )
}
export interface ConceptReactionsProps {
  concept: Concept
  onChange: (updatedConcept: Concept) => void
}

const ConceptReactions = ({ concept, onChange }: ConceptReactionsProps) => {
  return (
    <div className="relative flex justify-between">
      <div>
        <div className="flex">
          <PraiseButton concept={concept} onChange={onChange} />
        </div>
      </div>
    </div>
  )
}

export default ConceptReactions
