import ImageZoomable from '@/components/Creation/CreationInterface/media/ImageZoomable'
import { Creation } from '@edenlabs/eden-sdk'
import React, { ReactNode, useEffect, useState } from 'react'

const BaseParamGroup = ({
  label,
  value,
}: {
  label: string
  value: string | string[] | ReactNode
}) => {
  return (
    <div>
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div>
        {Array.isArray(value) ? (
          <div>{JSON.stringify(value)}</div>
        ) : (
          <div>{value}</div>
        )}
      </div>
    </div>
  )
}

const CreationInfo = ({ creation }: { creation: Creation }) => {
  const [displayDate, setDisplayDate] = useState('')

  useEffect(() => {
    setDisplayDate(new Date(creation.createdAt).toLocaleDateString())
  }, [creation.createdAt])

  return (
    <div>
      {creation.task.generator.output === 'creation' ? (
        <div className="flex gap-4 flex-wrap">
          <BaseParamGroup
            label="Type"
            value={<div>{creation.task.generator.generatorName}</div>}
          />
          <BaseParamGroup
            label="Size"
            value={
              <div>
                {creation.mediaAttributes.width}
                <span className="text-gray-400">x</span>
                {creation.mediaAttributes.height}
              </div>
            }
          />
          <BaseParamGroup label="Date" value={<div>{displayDate}</div>} />
        </div>
      ) : null}

      {creation.task.config['init_image_data'] ? (
        <div className="mt-4">
          <BaseParamGroup
            label="Init Image"
            value={
              <ImageZoomable
                url={creation.task.config['init_image_data']}
                width={96}
                height={96}
              />
            }
          />
        </div>
      ) : null}

      {creation.task.config['interpolation_init_images'] &&
      creation.task.config['interpolation_init_images'].length ? (
        <div className="mt-4">
          <BaseParamGroup
            label="Interpolation Images"
            value={
              <div className="flex gap-2 flex-wrap">
                {creation.task.config['interpolation_init_images'].map(
                  (initImage: string) => (
                    <ImageZoomable
                      key={initImage}
                      url={initImage}
                      width={96}
                      height={96}
                    />
                  ),
                )}
              </div>
            }
          />
        </div>
      ) : null}

      {/*{ baseParams.map(([key, val]) => <CreationInfoParam key={key} label={key} val={val} />)}*/}
    </div>
  )
}

export default CreationInfo
