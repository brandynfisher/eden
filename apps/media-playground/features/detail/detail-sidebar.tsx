import CopyTextButton from '@/components/text/copy-text-button'
import TextClampMore from '@/components/text/text-clamp-more'
import ParameterTable from '@/components/timeline/parameter-table'
import { Skeleton } from '@/components/ui/skeleton'
import UserAvatarLink from '@/components/user/user-avatar-link'
import PrivacyToggle from '@/features/detail/privacy-toggle'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { useTimeAgo } from 'next-timeago'
import Link from 'next/link'

type Props = {
  item?: CreationV2 | ModelV2
  type: 'creation' | 'model'
  inModal?: boolean
  onUpdate: () => void
}

const DetailSidebar = ({ item, type, inModal, onUpdate }: Props) => {
  const { user: creator } = item || {}
  const { prompt, text_input, ...remainingArgs } = item?.args || {}
  const { TimeAgo } = useTimeAgo()
  const { user } = useAuthState()

  return (
    <div
      className={cn([
        `flex-shrink-0 w-full lg:w-[388px] px-4 overflow-y-auto bg-accent rounded-md rounded-tr-none rounded-br-none`,
        inModal ? '' : 'mb-4',
      ])}
    >
      <div className="pt-4 pb-3">
        {item ? (
          <div>
            <UserAvatarLink
              name={item.user.username || item.user._id}
              image={item.user.userImage}
            />
            <div className="text-xs text-foreground/70 mt-2">
              <TimeAgo date={item.createdAt} />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-5 w-[100px]" />
          </div>
        )}
      </div>

      {creator?._id === user?._id ? (
        <div className="pb-3">
          {item && item.public !== undefined ? (
            <>
              <PrivacyToggle type={type} item={item} onUpdate={onUpdate} />
            </>
          ) : (
            <Skeleton className="h-[42px] w-[142px]" />
          )}
        </div>
      ) : null}

      {type === 'creation' ? (
        <div className="pb-4 text-sm">
          <div className="h-9 flex items-center justify-between font-bold">
            Tool
          </div>
          {item && (item as CreationV2).workflow ? (
            <Link
              href={`/create/${(item as CreationV2).mediaAttributes?.type}/${
                (item as CreationV2).workflow
              }`}
            >
              {(item as CreationV2).workflow}
            </Link>
          ) : (
            <Skeleton className="h-5 w-[125px]" />
          )}
        </div>
      ) : null}

      {type === 'creation' ? (
        <div className="pb-4 text-sm">
          <div className="h-9 flex items-center justify-between">
            <div className="font-bold">Prompt</div>
            {prompt || text_input ? (
              <CopyTextButton
                title={'Prompt'}
                text={prompt || text_input || ''}
              />
            ) : null}
          </div>
          {item ? (
            <TextClampMore text={prompt || text_input || '-'} />
          ) : (
            <div className="space-y-1">
              <Skeleton className="h-5 w-[250px]" />
              <Skeleton className="h-5 w-[250px]" />
              <Skeleton className="h-5 w-[250px]" />
            </div>
          )}
        </div>
      ) : null}

      <div>
        <div className="font-bold text-sm mb-3">Parameters</div>
        {item && remainingArgs ? (
          <ParameterTable args={remainingArgs} />
        ) : (
          <div className="space-y-1">
            <Skeleton className="h-5 w-[250px]" />
            <Skeleton className="h-5 w-[250px]" />
            <Skeleton className="h-5 w-[200px]" />
            <Skeleton className="h-5 w-[200px]" />
            <Skeleton className="h-5 w-[180px]" />
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailSidebar
