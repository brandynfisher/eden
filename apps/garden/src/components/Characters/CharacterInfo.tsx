import { BaseParamGroup } from '@/components/Creation/CreationDetail/CreationInfo'
import { Character } from '@edenlabs/eden-sdk'
import React, { useEffect, useState } from 'react'

const CharacterInfo = ({ character }: { character: Character }) => {
  const [displayDateTime, setDisplayDateTime] = useState('')

  useEffect(() => {
    const createdDate = new Date(character.createdAt)
    const dateString = createdDate.toLocaleDateString()
    const timeString = createdDate.toLocaleTimeString()
    const timeStringFormatted = timeString.substring(
      0,
      timeString.lastIndexOf(':'),
    )
    setDisplayDateTime(`${dateString} ${timeStringFormatted}`)
  }, [character.createdAt])

  return (
    <div className="flex gap-4 flex-wrap">
      <BaseParamGroup label="Type" value={<div>character</div>} />
      <BaseParamGroup label="Date" value={displayDateTime} />
    </div>
  )
}

export default CharacterInfo
