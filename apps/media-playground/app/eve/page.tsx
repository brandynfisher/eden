import { Skeleton } from '@/components/ui/skeleton'
import Chat from '@/features/chat/chat'
import { Suspense } from 'react'

const EvePage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 p-2 gap-2 max-h-screen h-full ">
          <Skeleton className={'w-full h-12'} />

          <div className="flex flex-1 gap-2 h-full">
            <Skeleton className={'w-[360px]'} />
            <div className="flex flex-col w-full gap-2">
              <Skeleton className={'w-full h-12'} />
              <Skeleton className={'mt-auto w-full h-full'} />
            </div>
          </div>
        </div>
      }
    >
      <Chat agentId={'675fd3af79e00297cdac1324'} />
    </Suspense>
  )
}

export default EvePage
