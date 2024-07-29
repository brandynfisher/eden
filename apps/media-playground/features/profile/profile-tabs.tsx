'use client'

import { Creator } from '@edenlabs/eden-sdk'

type Props = {
  creator: Creator
}

const ProfileTabs = ({ creator }: Props) => {
  return (
    <div>
      <div>tabs</div>
      <div>creations</div>
      <div>
        {creator.username} - {creator.userImage}
      </div>
    </div>
  )
}

export default ProfileTabs
