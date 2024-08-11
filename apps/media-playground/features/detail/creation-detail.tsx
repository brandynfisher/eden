'use client'

import CreationMediaPreview from '@/components/media/creation-media-preview'
import ParameterTable from '@/components/timeline/parameter-table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { CreationV2 } from '@edenlabs/eden-sdk'

type Props = {
  id: string
  creationSSRData?: CreationV2
}

const MediaSkeleton = () => {
  return (
    <div className="relative h-full max-h-full max-w-full flex-center flex flex-col space-y-3">
      <Skeleton className="min-h-[512px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}

const CreationDetail = ({ id, creationSSRData }: Props) => {
  const { user } = useAuthState()
  const { creation: creationClientData } = useCreationQuery({
    key: id,
    initialData: creationSSRData
      ? {
          creation: creationSSRData,
        }
      : undefined,
  })

  const creation = creationSSRData || creationClientData

  return (
    <div className="p-4">
      {/*<div>*/}
      {/*  AuthUser - {user?.username}*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*  Creation - {creation?.user.username}*/}
      {/*</div>*/}
      {/*<div>hasSSRData: {JSON.stringify(!!creationSSRData)}</div>*/}
      {/*<div>hasClientData: {JSON.stringify(!!creationClientData)}</div>*/}

      <div className="h-full w-full flex flex-col gap-2">
        {creation ? (
          <>
            <CreationMediaPreview creation={creation} />
            {user?._id === creation.user._id ? (
              <div>
                <Button variant={'outline'}>Action1</Button>
                <Button variant={'outline'}>Action2</Button>
                <Button variant={'outline'}>Action3</Button>
              </div>
            ) : null}
            {creation.args ? <ParameterTable args={creation.args} /> : null}
            {/*{JSON.stringify(creation, null, 2)}*/}
          </>
        ) : (
          <MediaSkeleton />
        )}
      </div>
    </div>
  )
}

export default CreationDetail
