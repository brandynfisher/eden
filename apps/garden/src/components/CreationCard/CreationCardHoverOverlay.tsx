import { SaveOutlined } from '@ant-design/icons'
import { Button } from 'antd'

const PraiseButton = () => {
  return (
    <Button
      className="flex items-center justify-center rounded-l-full bg-gray-800"
      role="button"
    >
      <span role="img" aria-label="Raise Hands" className="text-sm">
        🙌
      </span>
    </Button>
  )
}

const BurnButton = () => {
  return (
    <Button
      className="flex items-center justify-center rounded-r-full bg-gray-800"
      role="button"
    >
      <span role="img" aria-label="Fire" className="text-sm">
        🔥
      </span>
    </Button>
  )
}

const SaveButton = () => {
  return (
    <Button
      className="flex items-center justify-center rounded-full bg-gray-800"
      role="button"
    >
      <SaveOutlined />
    </Button>
  )
}

const CreationCardHoverOverlay = ({
  openDetailModal,
}: {
  openDetailModal: () => void
}) => {
  const handleClickOutside = event => {
    // Check if the click event target is not a button
    if (!event.target.closest('button')) {
      openDetailModal()
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
            <PraiseButton />
            <BurnButton />
          </div>
        </div>
        <div className="absolute top-0 right-0 mt-4 mr-4">
          <SaveButton />
        </div>
      </div>
    </div>
  )
}

export default CreationCardHoverOverlay
