import { Button } from 'antd'

const PraiseButton = ({
  praised,
  loading,
  onClick,
}: {
  praised: boolean | undefined
  loading: boolean
  onClick: () => void
}) => {
  return (
    <Button
      className={`flex items-center justify-center rounded-l-full bg-gray-800 ${
        praised ? 'bg-green-500' : ''
      }`}
      role="button"
      onClick={onClick}
      loading={loading}
    >
      <span role="img" aria-label="Raise Hands" className="text-sm">
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
  return (
    <Button
      className={`flex items-center justify-center rounded-r-full bg-gray-800 ${
        burned ? 'bg-red-500' : ''
      }`}
      role="button"
      onClick={onClick}
      loading={loading}
    >
      <span role="img" aria-label="Fire" className="text-sm">
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
  return (
    <Button
      className={`flex items-center justify-center rounded-full bg-gray-800 ${
        bookmarked ? 'bg-red-500' : ''
      }`}
      role="button"
      onClick={onClick}
      loading={loading}
    >
      💾
    </Button>
  )
}

export interface CreationCardHoverOverlayProps {
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
  handlers,
  loading,
  reactions,
  bookmarked,
}: CreationCardHoverOverlayProps) => {
  const handleClickOutside = event => {
    // Check if the click event target is not a button
    if (!event.target.closest('button')) {
      handlers.openDetailModal()
    }
  }

  return (
    <div
      className="absolute inset-0 flex items-start justify-center"
      onClick={handleClickOutside}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-start">
        <div className="flex items-center justify-center mt-4">
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
        <div className="absolute top-0 right-0 mt-4 mr-4">
          <SaveButton
            onClick={handlers.onSaveButtonClick}
            bookmarked={bookmarked}
            loading={loading.bookmarking}
          />
        </div>
      </div>
    </div>
  )
}

export default CreationCardHoverOverlay
