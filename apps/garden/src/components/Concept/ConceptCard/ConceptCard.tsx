import ConceptCardDetail from '@/components/Concept/ConceptCard/ConceptCardDetail'
import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { getModalUrls } from '@/lib/modal'
import { timeAgo } from '@/lib/time'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Concept } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { Tag } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const ConceptCard = ({ index, data }: { index: number; data: Concept }) => {
  const [concept /*setConcept*/] = useState(data)
  const router = useRouter()
  const { pageUrl, modalUrl } = getModalUrls(router, 'concept', concept._id)
  const { showModal } = useModalContext()
  const { hovered, ref } = useHover()

  const openDetailModal = async () => {
    await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    showModal(MODAL_TYPES.CONCEPT_DETAIL_MODAL, {
      concept: concept,
      usesUrl: true,
    })
  }

  const [createdDateString, setCreatedDateString] = useState('')
  const [trainingMode, setTrainingMode] = useState(null)
  const timeSinceCreation = timeAgo(concept.createdAt)

  useEffect(() => {
    setCreatedDateString(new Date(concept.createdAt).toLocaleString())
    const mode = concept?.task?.config?.mode
      ? concept?.task?.config?.mode
      : null
    setTrainingMode(mode)
  }, [concept])

  return (
    <div ref={ref} className="mx-auto max-w-[500px] md:mx-0 md:max-w-none">
      <div className="relative" key={index}>
        <div className="w-full flex justify-center flex-col">
          <div
            className={` flex items-center justify-between mb-[12px] md:absolute md:z-10 md:w-full md:top-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-t-lg md:py-1 md:px-2 pointer-events-none ${
              hovered ? 'md:!visible' : 'md:hidden'
            }`}
          >
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
                {timeSinceCreation}
              </div>
            </div>
          </div>
          <div
            className="card-image relative rounded-lg overflow-hidden cursor-pointer mb-2"
            onClick={openDetailModal}
          >
            <a
              onClick={ev => ev.preventDefault()}
              href={`/concepts/${concept._id}`}
              target={'_blank'}
              className="block"
            >
              <ImageResult
                previewSizeUrl={concept.thumbnail || ''}
                aspectRatio={100}
              />
            </a>
          </div>
          <div
            className={`mt-1 md:absolute md:z-10 md:w-full md:bottom-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-b-lg md:pb-2 md:px-2 pointer-events-none ${
              hovered ? 'md:!visible' : 'md:hidden'
            }`}
          >
            <ConceptCardDetail concept={concept} />
          </div>
        </div>
        <div className="absolute top-0.5 right-0 z-10 md:top-auto md:bottom-4 md:right-2">
          {trainingMode ? (
            <Tag color="blue" className="first-letter:capitalize me-0">
              {trainingMode}
            </Tag>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ConceptCard
