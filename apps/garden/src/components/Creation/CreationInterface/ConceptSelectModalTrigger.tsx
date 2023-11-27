import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Concept } from '@edenlabs/eden-sdk'
import ModelTrainingIcon from '@mui/icons-material/ModelTraining'
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
      className="w-full flex !py-1 !px-2 items-center gap-2 !bg-gray-300 hover:!bg-gray-400 dark:!bg-gray-950 dark:hover:!bg-gray-950 bg-opacity-50 hover:!bg-opacity-70 !normal-case"
    >
      <ModelTrainingIcon fontSize="small" />
      <div>Select Concept</div>
    </Button>
  )
}

export default ConceptSelectModalTrigger
