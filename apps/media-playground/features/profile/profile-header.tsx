'use client'

import { Badge } from '@/components/ui/badge'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { useAuthState } from '@/hooks/use-auth-state'
import customImageLoader from '@/image-loader'
import { Creator } from '@edenlabs/eden-sdk'
import Image from 'next/image'

type Props = {
  name: string
  creatorSSRData: Creator
}

const ProfileHeader = ({ name, creatorSSRData }: Props) => {
  const { user } = useAuthState()
  const { creator: creatorClientData } = useCreatorQuery({
    key: name,
    initialData: {
      creator: creatorSSRData,
    },
  })

  const creator = creatorSSRData || creatorClientData

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative rounded-full overflow-hidden w-fit border-popover-foreground border-2 max-h-16 max-w-16 lg:max-h-full lg:max-w-full">
          <Image
            loader={customImageLoader}
            src={creator.userImage || ''}
            alt={creator.username || ''}
            width={96}
            height={96}
          />
        </div>
        <div>
          <TypographyH3 className="text-lg md:text-xl mb-2">
            {name}
          </TypographyH3>
          <div>
            {user?._id === creator?._id ? (
              <Badge variant={'outline'}>My profile</Badge>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
