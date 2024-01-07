'use client'

import SelectModal from '@/components/Modals/SelectModal'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'

const SelectConceptModal = ({
  onChange,
  ...rest
}: {
  onChange: (item: Concept) => void
}) => {
  return (
    <SelectModal
      itemType="concept"
      onChange={item => onChange(item as Concept)}
      {...rest}
    />
  )
}

export default SelectConceptModal
