import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import ConceptCardDetail from '@/components/Concept/ConceptCard/ConceptCardDetail'
import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { handleAxiosError } from '@/lib/fetcher'
import { timeAgo } from '@/lib/time'
import { Concept } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { useViewportSize } from '@mantine/hooks'
import LockIcon from '@mui/icons-material/Lock'
import { Button } from '@mui/material'
import { App } from 'antd'
import axios from 'axios'
import React, { FC, useCallback, useEffect, useState } from 'react'

const ConceptCard: FC<{
  // index: number
  data: Concept
  onClick: (concept: Concept) => void
  hidePrompt?: boolean
}> = ({
  // index,
  data,
  onClick,
  hidePrompt,
}) => {
  const { message } = App.useApp()
  const { hovered, ref } = useHover()
  const { width } = useViewportSize()

  const [concept, setConcept] = useState<Concept>(data)
  const [createdDateString, setCreatedDateString] = useState('')
  const [dropdownActive, setDropdownActive] = useState(false)
  const timeSinceConcept = timeAgo(concept.createdAt)

  useEffect(() => {
    setCreatedDateString(new Date(concept.createdAt).toLocaleString())
  }, [concept])

  const onRestoreClick = useCallback(async () => {
    try {
      await axios.patch(`/api/concepts/${concept._id}`, {
        update: { deleted: false },
      })
      message.destroy()
      message.success(`Concept restored`)

      setConcept({
        ...concept,
        deleted: false,
      })
    } catch (err) {
      handleAxiosError(err, message)
    }
  }, [concept])

  const cardClickHandler = useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault()
      // console.log(concept)
      onClick(concept)
    },
    [concept, onClick],
  )

  return (
    <div ref={ref} className={`w-full flex justify-center flex-col relative`}>
      <a
        onClick={cardClickHandler}
        href={`/concepts/${concept._id}`}
        target={'_blank'}
        className={`card-image relative rounded-lg overflow-hidden cursor-pointer block  ${
          concept.deleted ? 'grayscale' : ''
        }`}
      >
        <ImageResult
          previewSizeUrl={concept.thumbnail || ''}
          aspectRatio={100}
        />
      </a>
      {concept.deleted ? (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <Button
            size="small"
            variant="outlined"
            color="warning"
            className="bg-black bg-opacity-50"
            onClick={onRestoreClick}
          >
            Restore
          </Button>
        </div>
      ) : null}
      {!concept.deleted && concept.isPrivate ? (
        <div
          className={`hidden md:flex absolute right-1 top-1 z-10 bg-gray-700 rounded-full w-8 h-8 items-center justify-center pointer-events-none ${
            hovered ? 'md:hidden' : ''
          }`}
        >
          <LockIcon fontSize="small" className="text-white" />
        </div>
      ) : null}
      {!concept.deleted && (width < 768 || hovered || dropdownActive) ? (
        <>
          <div
            className={`order-first md:order-none flex items-center justify-between mb-[12px] md:absolute md:z-10 md:w-full md:top-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-t-lg md:py-1 md:px-2 pointer-events-none opacity-0 transition-opacity duration-300 ${
              width ? 'opacity-100' : ''
            }`}
          >
            {!hidePrompt ? (
              <div className="flex items-center pointer-events-auto my-1">
                <CreatorProfileLink
                  creatorId={concept.user.userId}
                  creatorName={concept.user.username}
                  creatorImage={concept.user.userImage}
                />
                <div
                  className="text-gray-700 dark:text-gray-400 text-xs"
                  title={createdDateString}
                >
                  <span className="mx-1">•</span>
                  {timeSinceConcept}
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-4 ml-auto my-1">
              {concept.isPrivate ? <LockIcon fontSize="small" /> : null}
              <CardToolsDropdown
                onOpen={setDropdownActive}
                item={concept}
                itemType={'concept'}
                onChange={updatedItem => setConcept(updatedItem as Concept)}
              />
            </div>
          </div>
          <div
            className={`mt-1 md:absolute md:z-10 md:w-full md:bottom-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-b-lg md:pb-2 md:px-2 pointer-events-none`}
          >
            {/*<CreationReactions*/}
            {/*  creation={concept}*/}
            {/*  onChange={updatedConcept =>*/}
            {/*    setConcept(updatedConcept as Concept)*/}
            {/*  }*/}
            {/*  showCounts={true}*/}
            {/*/>*/}
            {!hidePrompt ? <ConceptCardDetail concept={concept} /> : null}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default ConceptCard
