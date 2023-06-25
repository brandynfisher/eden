import React from 'react'
import Blockies from 'react-blockies'

const ProfileAvatar = ({ seed }: { seed: string }) => {
  return (
    <div className="relative z-0 flex justify-center overflow-hidden rounded-full ">
      <div className="flex">
        <Blockies
          seed={seed ? seed : ''}
          color="#64b77e"
          className="relative -z-10 bg-white"
        />
      </div>
    </div>
  )
}

export default ProfileAvatar
