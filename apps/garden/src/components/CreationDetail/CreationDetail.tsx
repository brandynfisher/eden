import CreationReactions from '@/components/CreationReactions'
import CreatorProfileLink from '@/components/CreatorProfileLink'
import FollowControls from '@/components/FollowControls'
import { Creation } from '@eden-labs/eden-sdk'
import React, { useState } from 'react'

const CreationDetail = ({ creation }: { creation: Creation }) => {
  const [creationData, setCreationData] = useState(creation)

  return (
    <div className="xl:flex xl:justify-center">
      <div className="w-full flex flex-shrink-0 justify-center xl:justify-normal xl:w-auto items-start">
        <div className="inline-flex mb-4 max-h-72vh xl:max-h-88vh">
          <div className="flex justify-center xl:justify-end overflow-hidden">
            <img
              src={creationData.uri}
              alt={creationData.name}
              className="max-h-full max-w-full object-contain rounded-xl overflow-hidden"
            />
          </div>
        </div>
      </div>
      <div className="xl:max-w-lg xl:flex-grow xl:flex xl:flex-col xl:ml-4">
        <div className="col-span-12 mb-4 border border-gray-300 dark:border-gray-600 border-solid rounded-lg p-4 bg-gray-100 dark:bg-gray-900">
          <CreationReactions
            creation={creationData}
            onChange={setCreationData}
          />
        </div>

        <div className="mb-4 col-span-4 xl:col-span-12 flex flex-col min-w-0 p-4 border border-gray-300 dark:border-gray-600 border-solid rounded-lg">
          <div className="overflow-hidden flex items-center">
            <div className="min-w-0">
              <CreatorProfileLink creatorId={creationData.user.userId} />
            </div>
          </div>
          <div>
            <FollowControls creatorId={creationData.user.userId} />
          </div>
        </div>
        <div className="col-span-8 p-4 border border-gray-300 dark:border-gray-600 border-solid rounded-lg bg-gray-100 dark:bg-gray-900">
          <div>
            {/*{ creationData.task.generator.generatorName }*/}
            {creationData.task.config &&
              Object.entries(creationData.task.config).map(([key, val]) => (
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
