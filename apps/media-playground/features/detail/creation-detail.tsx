'use client'

import CreationMediaPreview from '@/components/media/creation-media-preview'
import ParameterTable from '@/components/timeline/parameter-table'
import { Skeleton } from '@/components/ui/skeleton'
import UserAvatarLink from '@/components/user/user-avatar-link'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { cn } from '@/lib/utils'
import { CreationV2 } from '@edenlabs/eden-sdk'

type Props = {
  id: string
  creationSSRData?: CreationV2
  isModal?: boolean
}

const CreationDetail = ({ id, creationSSRData, isModal }: Props) => {
  // const { user } = useAuthState()
  const { creation: creationClientData } = useCreationQuery({
    key: id,
    initialData: creationSSRData
      ? {
          creation: creationSSRData,
        }
      : undefined,
  })

  const creation = creationSSRData || creationClientData

  // const { height: viewportHeight } = useViewportSize()

  return (
    // <div className='w-full flex flex-col flex-grow md:flex-row gap-4 md:h-[calc(100dvh_-_64px)] md:w-[calc(100dvw_-_32px)]'>
    <div
      className={cn([
        `w-full flex flex-col flex-grow md:flex-row md:gap-4 max-h-full md:ml-4`,
        isModal
          ? 'h-[calc(100dvh_-_34px)] w-[calc(100dvw_-_32px)]'
          : 'md:h-[calc(100dvh_-_64px)] md:w-[calc(100dvw_-_16px)]',
      ])}
    >
      {creation ? (
        <CreationMediaPreview creation={creation} />
      ) : (
        <Skeleton className="min-h-[512px] w-full rounded-xl" />
      )}

      <div
        className={cn([
          `flex-shrink-0 w-full md:w-[400px] px-4 overflow-y-auto bg-accent rounded-md rounded-tr-none rounded-br-none`,
          isModal ? '' : 'my-4',
        ])}
      >
        {creation?.user ? (
          <div className="py-4">
            <UserAvatarLink
              name={creation.user.username || creation.user._id}
              image={creation.user.userImage}
            />
          </div>
        ) : null}

        {creation && creation.args ? (
          <ParameterTable args={creation.args} />
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[180px]" />
          </div>
        )}
      </div>
    </div>
  )
}

export default CreationDetail
