import React from 'react'
import Blockies from 'react-blockies'

const ProfileAvatar = ({ seed }: { seed: string }) => {
  return (
    <div className="relative z-0 flex justify-center overflow-hidden rounded-full">
      <div
        className="flex overflow-hidden"
        style={{ boxShadow: 'inset 0px 0px 7px rgba(0,0,0,1)' }}
      >
        <Blockies
          seed={seed ? seed : ''}
          color="#64b77e"
          className="relative -z-10"
        />
      </div>
    </div>
  )
}

export default ProfileAvatar
