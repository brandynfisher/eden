'use client'

import ModelMediaPreview from '@/components/media/model-media-preview'
import ParameterTable from '@/components/timeline/parameter-table'
import { Skeleton } from '@/components/ui/skeleton'
import UserAvatarLink from '@/components/user/user-avatar-link'
import { useModelQuery } from '@/hooks/query/use-model-query'
import { cn } from '@/lib/utils'
import { ModelV2 } from '@edenlabs/eden-sdk'

type Props = {
  id: string
  modelSSRData?: ModelV2
  isModal?: boolean
}

const ModelDetail = ({ id, modelSSRData, isModal }: Props) => {
  // const { user } = useAuthState()
  const { model: modelClientData } = useModelQuery({
    key: id,
    initialData: modelSSRData
      ? {
          model: modelSSRData,
        }
      : undefined,
  })

  const model = modelSSRData || modelClientData

  return (
    <>
      <div
        className={cn([
          `w-full flex flex-col flex-grow lg:flex-row lg:gap-4 max-h-full lg:ml-4`,
          isModal
            ? 'lg:h-[calc(100vh_-_34px)] w-[calc(100dvw_-_32px)]'
            : 'lg:h-[calc(100vh_-_64px)] lg:w-[calc(100dvw_-_16px)]',
        ])}
      >
        {model ? (
          <ModelMediaPreview model={model} isModal={isModal} />
        ) : (
          <Skeleton className="min-h-[512px] w-full rounded-xl fade-in" />
        )}

        <div
          className={cn([
            `flex-shrink-0 w-full lg:w-[388px] px-4 overflow-y-auto bg-accent rounded-md rounded-tr-none rounded-br-none`,
            isModal ? '' : 'my-4',
          ])}
        >
          {model?.user ? (
            <div className="py-4">
              <UserAvatarLink
                name={model.user.username || model.user._id}
                image={model.user.userImage}
              />
            </div>
          ) : null}

          {model && model.args ? (
            <ParameterTable args={model.args} />
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
    </>
  )
}

export default ModelDetail
