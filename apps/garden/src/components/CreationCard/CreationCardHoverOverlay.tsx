import CreationCardCreator from '@/components/CreationCard/CreationCardCreator'
import { useHover } from '@mantine/hooks'
import { Button } from 'antd'
import React from 'react'

const PraiseButton = ({
  praised,
  loading,
  onClick,
}: {
  praised: boolean | undefined
  loading: boolean
  onClick: () => void
}) => {
  const { hovered, ref } = useHover()
  return (
    <Button
      className={`flex items-center justify-center rounded-l-full`}
      role="button"
      onClick={onClick}
      loading={loading}
      ref={ref}
    >
      <span
        role="img"
        aria-label="Raise Hands"
        className={`text-sm ${!hovered && !praised && 'filter grayscale'}`}
      >
        🙌
      </span>
    </Button>
  )
}

const BurnButton = ({
  burned,
  loading,
  onClick,
}: {
  burned: boolean | undefined
  loading: boolean
  onClick: () => void
}) => {
  const { hovered, ref } = useHover()

  return (
    <Button
      className={`flex items-center justify-center rounded-r-full`}
      role="button"
      onClick={onClick}
      disabled={loading}
      ref={ref}
    >
      <span
        role="img"
        aria-label="Fire"
        className={`text-sm ${!hovered && !burned && 'filter grayscale'}`}
      >
        🔥
      </span>
    </Button>
  )
}

const SaveButton = ({
  bookmarked,
  loading,
  onClick,
}: {
  bookmarked: boolean | undefined
  loading: boolean
  onClick: () => void
}) => {
  const { hovered, ref } = useHover()
  return (
    <Button
      className={`flex items-center justify-center rounded-full`}
      role="button"
      onClick={onClick}
      disabled={loading}
      ref={ref}
    >
      <span
        role="img"
        aria-label="Save"
        className={`text-sm ${!hovered && !bookmarked && 'filter grayscale'}`}
      >
        ⭐️
      </span>
    </Button>
  )
}

export interface CreationCardHoverOverlayProps {
  creatorId: string
  handlers: {
    onPraiseButtonClick: () => void
    onBurnButtonClick: () => void
    onSaveButtonClick: () => void
    openDetailModal: () => void
  }
  loading: {
    praising: boolean
    burning: boolean
    bookmarking: boolean
  }
  reactions: {
    praised: boolean
    burned: boolean
  }
  bookmarked: boolean
}

const CreationCardHoverOverlay = ({
  creatorId,
  handlers,
  loading,
  reactions,
  bookmarked,
}: CreationCardHoverOverlayProps) => {
  const handleClickOutside = (event: React.MouseEvent) => {
    // Check if the click event target is not a button
    const targetElement = event.target as Element
    if (!targetElement.closest('button')) {
      handlers.openDetailModal()
    }
  }

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between"
      onClick={handleClickOutside}
    >
      <div className="relative flex justify-between mx-4 mt-4">
        <div>
          <div className="flex">
            <PraiseButton
              onClick={handlers.onPraiseButtonClick}
              praised={reactions.praised}
              loading={loading.praising}
            />
            <BurnButton
              onClick={handlers.onBurnButtonClick}
              burned={reactions.burned}
              loading={loading.burning}
            />
          </div>
        </div>
        <div>
          <SaveButton
            onClick={handlers.onSaveButtonClick}
            bookmarked={bookmarked}
            loading={loading.bookmarking}
          />
        </div>
      </div>
      <div className="mx-4 mb-4">
        <CreationCardCreator creatorId={creatorId} />
      </div>
    </div>
  )
}

export default CreationCardHoverOverlay
