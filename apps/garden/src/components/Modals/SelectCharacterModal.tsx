'use client'

import SelectModal from '@/components/Modals/SelectModal'
import { Character } from '@edenlabs/eden-sdk'
import React from 'react'

const SelectCharacterModal = ({
  onChange,
  ...rest
}: {
  onChange: (item: Character) => void
}) => {
  return (
    <SelectModal
      itemType="character"
      onChange={item => onChange(item as Character)}
      {...rest}
    />
  )
}

export default SelectCharacterModal
