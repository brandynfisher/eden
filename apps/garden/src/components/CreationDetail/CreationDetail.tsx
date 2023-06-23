import CreatorProfileLink from '@/components/CreatorProfileLink'
import FollowControls from '@/components/FollowControls'
import { Creation } from '@eden-labs/eden-sdk'
import { useHover } from '@mantine/hooks'
import React from 'react'

const CreationDetail = ({ creation }: { creation: Creation }) => {
  const { hovered, ref } = useHover()

  return (
    <div className="xl:flex xl:justify-center">
      <div className="w-full flex flex-shrink-0 justify-center xl:justify-normal xl:w-auto items-start">
        <div className="inline-flex mb-4 rounded-xl overflow-hidden">
          <img
            src={creation.uri}
            alt={creation.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>
      <div className="xl:max-w-lg xl:flex-grow xl:flex xl:flex-col xl:ml-4">
        <div className="mb-4 col-span-4 xl:col-span-12 flex flex-col min-w-0 p-4 border border-gray-300 dark:border-gray-600 border-solid rounded-lg">
          <div className="overflow-hidden flex items-center">
            <div className="min-w-0" ref={ref}>
              {/*// @ts-ignore: @todo: fix the feed response type*/}
              <CreatorProfileLink
                creatorId={
                  creation.user.userId ? creation.user.userId : creation.user
                }
                hovered={hovered}
              />
            </div>
          </div>
          <div>
            {/*// @ts-ignore: @todo: fix the feed response type*/}
            <FollowControls
              creatorId={
                creation.user.userId ? creation.user.userId : creation.user
              }
            />
          </div>
        </div>
        <div className="col-span-8 p-4 border border-gray-300 dark:border-gray-600 border-solid rounded-lg">
          <div>
            {/*// @ts-ignore: @todo: fix the feed response type*/}
            {creation.task.config &&
              // @ts-ignore: @todo: fix the feed response type
              Object.entries(creation.task.config).map(([key, val]) => (
                <div key={`cfg-${key}`} className="mb-4 last:mb-0">
                  <div className="text-gray-500 capitalize">{key}</div>
                  {/*// @ts-ignore: @todo: fix the feed response type*/}
                  <div>{val}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreationDetail
