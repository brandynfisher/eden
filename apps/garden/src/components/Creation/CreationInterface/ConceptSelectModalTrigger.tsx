import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Concept } from '@edenlabs/eden-sdk'
import Button from '@mui/material/Button'
import React from 'react'

const ConceptSelectModalTrigger = ({
  onChange,
}: {
  onChange: (concept: Concept) => void
}) => {
  const { showModal, hideModal } = useModalContext()

  const handleClickOpen = () => {
    showModal(MODAL_TYPES.CONCEPT_SELECT_MODAL, {
      onChange: handleChange,
    })
  }

  const handleChange = (concept: Concept) => {
    onChange(concept)
    hideModal(MODAL_TYPES.CONCEPT_SELECT_MODAL)
  }

  return (
    <Button
      variant="outlined"
      onClick={handleClickOpen}
      className="w-full bg-gray-300 hover:!bg-gray-300 dark:bg-gray-900 dark:hover:!bg-gray-950 bg-opacity-50 hover:!bg-opacity-70 !normal-case"
    >
      Select Concept
    </Button>
  )
}

export default ConceptSelectModalTrigger
