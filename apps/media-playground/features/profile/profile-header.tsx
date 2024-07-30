'use client'

import { Badge } from '@/components/ui/badge'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { Creator } from '@edenlabs/eden-sdk'
import Image from 'next/image'

type Props = {
  name: string
  creatorInitData: Creator
}

const ProfileHeader = ({ name, creatorInitData }: Props) => {
  const { user } = useAuthState()
  const { creator } = useCreatorQuery({
    key: name,
    initialData: {
      creator: creatorInitData,
    },
  })
  const currentData = creatorInitData || creator

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="rounded-full overflow-hidden w-fit border-popover-foreground border-2">
          <Image
            src={currentData.userImage || ''}
            alt={currentData.username || ''}
            width={96}
            height={96}
          />
        </div>
        <div>
          <TypographyH3>{name}</TypographyH3>
          <div>
            {user?._id === creator?._id ? (
              <Badge variant={'destructive'}>authed profile</Badge>
            ) : (
              <Badge variant={'default'}>other profile</Badge>
            )}
          </div>
        </div>
      </div>

      {/*<div className="flex flex-col gap-4 mt-6">*/}
      {/*  <TypographyH4>clientQuery data</TypographyH4>*/}
      {/*  <code>*/}
      {/*    <pre className="font-mono bg-popover overflow-scroll">*/}
      {/*      {JSON.stringify(creator, null, 2)}*/}
      {/*    </pre>*/}
      {/*  </code>*/}

      {/*  <TypographyH4>SSR Init</TypographyH4>*/}
      {/*  <code>*/}
      {/*    <pre className="font-mono bg-popover overflow-scroll">*/}
      {/*      {JSON.stringify(creatorInitData, null, 2)}*/}
      {/*    </pre>*/}
      {/*  </code>*/}
      {/*</div>*/}
    </div>
  )
}

export default ProfileHeader
