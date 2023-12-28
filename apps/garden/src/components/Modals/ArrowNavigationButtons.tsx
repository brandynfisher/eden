import CircleButton from '@/components/Layout/buttons/CircleButton'
import { Character, Concept, Creation, Creator } from '@edenlabs/eden-sdk'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import React from 'react'

const ArrowNavigationButtons = ({
  items,
  currentIndex,
  handlePrev,
  handleNext,
  handleCancel,
}: {
  items: Creation[] | Concept[] | Creator[] | Character[]
  currentIndex: number
  handlePrev: () => void
  handleNext: () => void
  handleCancel:
    | ((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void)
    | undefined
}) => {
  return (
    <div className="fixed bottom-4 w-fit left-[calc(50%_-_77px)] md:bottom-auto flex md:justify-between md:top-1/2 md:w-[calc(100vw_-_32px)] md:left-2 gap-4 bg-gray-200 dark:bg-gray-950 rounded-full border border-solid border-gray-600 md:border-none md:p-0 md:!bg-transparent md:dark!bg-transparent opacity-0 anim-fade-in shadow-2xl md:shadow-none z-10 pointer-events-none">
      <div className="justify-self-start pointer-events-auto">
        <CircleButton
          disabled={currentIndex - 1 < 0}
          title={'Prev'}
          icon={<KeyboardArrowLeftIcon fontSize="large" />}
          onClick={handlePrev}
          className="md:h-[120px] md:top-[-60px] md:relative md:border md:border-solid md:border-gray-800 md:dark:border-gray-400 md:!border-opacity-50"
        />
      </div>
      <div className="pointer-events-auto md:hidden">
        <CircleButton
          title={'Close'}
          icon={<CloseIcon fontSize="large" />}
          //@ts-ignore
          onClick={handleCancel}
        />
      </div>
      <div className="justify-self-end pointer-events-auto">
        <CircleButton
          disabled={currentIndex + 1 >= items.length}
          title={'Next'}
          icon={<KeyboardArrowRightIcon fontSize="large" />}
          onClick={handleNext}
          className="md:h-[120px] md:top-[-60px] md:relative md:left-2 lg:right-auto md:border md:border-solid md:border-gray-600"
        />
      </div>
    </div>
  )
}

export default ArrowNavigationButtons
