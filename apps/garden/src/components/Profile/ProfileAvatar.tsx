import React from 'react'
import Blockies from 'react-blockies'

const ProfileAvatar = ({ seed }: { seed: string }) => {
  return (
    <div className="relative z-0  w-8 h-8">
      <div className="flex h-full w-full">
        <Blockies
          seed={seed ? seed : ''}
          color="#64b77e"
          className="relative -z-10 scaled-canvas rounded-full"
          size={10}
          scale={5}
        />
      </div>
    </div>
  )
}

export default ProfileAvatar
