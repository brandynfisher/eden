import SelectModalTrigger from '@/components/Creation/CreationInterface/SelectModalTrigger'
import { MODAL_TYPES } from '@/providers/ModalProvider'
import RobotOutlined from '@ant-design/icons/RobotOutlined'
import { Character } from '@edenlabs/eden-sdk'
import React from 'react'

const SelectCharacterModalTrigger = ({
  onChange,
}: {
  onChange: (item: Character) => void
}) => {
  return (
    <SelectModalTrigger
      modalType={MODAL_TYPES.CHARACTER_SELECT_MODAL}
      // maxSelectableItems={1}
      buttonContent={
        <>
          <RobotOutlined />
          <div>Select Concept</div>
        </>
      }
      onChange={item => onChange(item as Character)}
    />
  )
}

export default SelectCharacterModalTrigger
