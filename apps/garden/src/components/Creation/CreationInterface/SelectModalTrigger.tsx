import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Character, Concept } from '@edenlabs/eden-sdk'
import Button from '@mui/material/Button'
import React, { ReactNode } from 'react'

const SelectModalTrigger = ({
  buttonContent,
  modalType,
  onChange,
}: {
  buttonContent: ReactNode
  modalType: MODAL_TYPES
  onChange: (item: Concept | Character) => void
}) => {
  const { showModal, hideModal } = useModalContext()

  const handleClickOpen = () => {
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
      className="w-full flex !py-1 !px-2 items-center gap-2 !bg-gray-300 hover:!bg-gray-400 dark:!bg-gray-950 dark:hover:!bg-gray-950 bg-opacity-50 hover:!bg-opacity-70 !normal-case"
    >
      {buttonContent}
    </Button>
  )
}

export default SelectModalTrigger
