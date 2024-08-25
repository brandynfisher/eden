import ParameterTable from '@/components/timeline/parameter-table'
import { Skeleton } from '@/components/ui/skeleton'
import UserAvatarLink from '@/components/user/user-avatar-link'
import { cn } from '@/lib/utils'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { timeAgo } from 'garden/src/lib/time'
import Link from 'next/link'

type Props = {
  item?: CreationV2 | ModelV2
  type: 'creation' | 'model'
  inModal?: boolean
}

const DetailSidebar = ({ item, type, inModal }: Props) => {
  const { prompt, text_input, ...remainingArgs } = item?.args || {}

  return (
    <div
      className={cn([
        `flex-shrink-0 w-full lg:w-[388px] px-4 overflow-y-auto bg-accent rounded-md rounded-tr-none rounded-br-none`,
        inModal ? '' : 'my-4',
      ])}
    >
      <div className="py-4">
        {item ? (
          <div>
            <UserAvatarLink
              name={item.user.username || item.user._id}
              image={item.user.userImage}
            />
            <div className="text-xs text-foreground/70 mt-2">
              {timeAgo(item.createdAt)} ago
            </div>
          </div>
        ) : (
          <Skeleton className="h-4 w-[250px]" />
        )}
      </div>

      {type === 'creation' ? (
        <div className="pb-4 text-sm">
          <div className="font-bold mt-2 mb-3">Tool</div>
          {item && (item as CreationV2).workflow ? (
            <Link
              href={`/create/${(item as CreationV2).mediaAttributes?.type}/${(item as CreationV2).workflow}`}
            >
              {(item as CreationV2).workflow}
            </Link>
          ) : (
            <Skeleton className="h-4 w-[125px]" />
          )}
        </div>
      ) : null}

      <div className="pb-4 text-sm">
        <div className="font-bold mt-2 mb-3">Prompt</div>
        {item && (prompt || text_input) ? (
          <div>{prompt || text_input}</div>
        ) : (
          <>
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[250px]" />
          </>
        )}
      </div>

      <div>
        <div className="font-bold text-sm mt-2 mb-3">Parameters</div>
        {item && remainingArgs ? (
          <ParameterTable args={remainingArgs} />
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

export default DetailSidebar
