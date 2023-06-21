import { Creation } from '@eden-labs/eden-sdk'
import { Card } from 'antd'
import React from 'react'

const CreationDetail = ({ creation }: { creation: Creation }) => {
  return (
    <div className="pt-4">
      <div className="mb-4 rounded-xl overflow-hidden">
        <img src={creation.thumbnail} alt="" className="max-h-full max-w-full object-contain" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-4">
          <div className="text-gray-500">User</div>
          {/*// @ts-ignore: @todo: fix the feed response type*/}
          <div>{creation.user.userId}</div>
        </Card>
        <Card className="col-span-8">
          <div className="grid grid-cols-2">
            {/*// @ts-ignore: @todo: fix the feed response type*/}
            {creation.task.config &&
              // @ts-ignore: @todo: fix the feed response type
              Object.entries(creation.task.config).map(([key, val]) => (
                <div key={`cfg-${key}`}>
                  <div className="text-gray-500 capitalize">{key}</div>
                  {/*// @ts-ignore: @todo: fix the feed response type*/}
                  <div>{val}</div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default CreationDetail
