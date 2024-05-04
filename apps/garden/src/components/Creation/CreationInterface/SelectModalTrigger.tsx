import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Character, Concept } from '@edenlabs/eden-sdk'
import Button from '@mui/material/Button'
import React, { ReactNode } from 'react'
import { sendGTMEvent } from '@next/third-parties/google'

const SelectModalTrigger = ({
  buttonContent,
  modalType,
  onChange,
  hasValue,
}: {
  buttonContent: ReactNode
  modalType: MODAL_TYPES
  onChange: (item: Concept | Character) => void
  hasValue?: boolean
}) => {
  const { showModal, hideModal } = useModalContext()

  const handleClickOpen = () => {
    sendGTMEvent({ event: `modal`, modalType: modalType})
    showModal(modalType, {
      onChange: handleChange,
    })
  }

  const handleChange = (item: Concept | Character) => {
    onChange(item)
    hideModal(null, modalType)
  }

  return (
    <Button
      variant="outlined"
      onClick={handleClickOpen}
      className={`w-full flex !py-1 !px-2 items-center gap-2 bg-gray-300 hover:!bg-blue-200 dark:!bg-gray-950 dark:hover:!bg-gray-950 bg-opacity-70 hover:!bg-opacity-70 !normal-case ${
        hasValue ? 'hidden' : ''
      }`}
    >
      {buttonContent}
    </Button>
  )
}

export default SelectModalTrigger
