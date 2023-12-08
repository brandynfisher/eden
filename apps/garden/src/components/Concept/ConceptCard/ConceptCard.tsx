import CardImage from '@/components/Card/CardImage'
import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import ConceptCardDetail from '@/components/Concept/ConceptCard/ConceptCardDetail'
import ConceptCardFooter from '@/components/Concept/ConceptCard/ConceptCardFooter'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { handleAxiosError } from '@/lib/fetcher'
import { timeAgo } from '@/lib/time'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { useViewportSize } from '@mantine/hooks'
import LockIcon from '@mui/icons-material/Lock'
import { Button } from '@mui/material'
import { App } from 'antd'
import axios from 'axios'
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react'

export const trainingModeColorMap: { [key: string]: string } = {
  style: 'lime',
  face: 'blue',
  concept: 'purple',
  object: 'cyan',
}

const ConceptCard: FC<{
  index: number
  data: Concept
  onClick: (concept: Concept) => void
  hidePrompt?: boolean
  sizes?: string
  className?: string
}> = ({ index, data, onClick, hidePrompt, sizes, className }) => {
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
      onClick(concept)
    },
    [onClick],
  )

  return (
    <div
      ref={ref}
      onClick={cardClickHandler}
      className={`relative w-full flex justify-center flex-col cursor-pointer ${
        className || ''
      }`}
    >
      {/*<div className="flex flex-col md:block relative">*/}
      <a
        href={`/concepts/${concept._id}`}
        target={'_blank'}
        className={`card-image relative overflow-hidden block  ${
          concept.deleted ? 'grayscale' : ''
        }`}
      >
        <CardImage
          uri={concept.thumbnail || ''}
          width={0}
          height={0}
          priority={index < 10}
          sizes={sizes}
          className="!rounded-none !rounded-t-lg"
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
                onChange={
                  setConcept as Dispatch<SetStateAction<Concept | Creation>>
                }
              />
            </div>
          </div>
          <div
            className={`pt-2 md:pt-0 md:absolute md:z-10 md:w-full md:bottom-10 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80  md:px-2 pointer-events-none md:hidden ${
              hovered ? 'md:!block' : ''
            }`}
          >
            <div className="relative hidden md:flex justify-between">
              <div className="h-10">
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
            <ConceptCardDetail concept={concept} />
          </div>
        </>
      ) : null}
      <div className="absolute flex gap-2 z-10 me-0 bottom-6 right-0 md:bg-gray-100 md:dark:bg-gray-900 md:rounded-b-lg md:bottom-auto md:py-2 md:relative md:w-full md:flex md:justify-between md:px-2">
        <ConceptCardFooter concept={concept} />
      </div>
    </div>
  )
}

export default ConceptCard
