import SelectModalTrigger from '@/components/Creation/CreationInterface/SelectModalTrigger'
import { MODAL_TYPES } from '@/providers/ModalProvider'
import { Concept } from '@edenlabs/eden-sdk'
import ModelTrainingIcon from '@mui/icons-material/ModelTraining'
import React from 'react'

const SelectConceptModalTrigger = ({
  onChange,
}: {
  onChange: (concept: Concept) => void
}) => {
  return (
    <SelectModalTrigger
      modalType={MODAL_TYPES.CONCEPT_SELECT_MODAL}
      // maxSelectableItems={1}
      buttonContent={
        <>
          <ModelTrainingIcon fontSize="small" />
          <div>Select Concept</div>
        </>
      }
      onChange={item => onChange(item as Concept)}
    />
  )
}

export default SelectConceptModalTrigger
