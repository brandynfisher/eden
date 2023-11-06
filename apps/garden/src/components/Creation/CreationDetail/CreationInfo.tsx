import ImageZoomable from '@/components/Creation/CreationInterface/media/ImageZoomable'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useConcept } from '@/hooks/useConcept'
import { Creation } from '@edenlabs/eden-sdk'
import Link from 'next/link'
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
          <div title={value?.toString()}>{JSON.stringify(value)}</div>
        ) : (
          <div title={typeof value === 'string' ? value?.toString() : ''}>
            {value}
          </div>
        )}
      </div>
    </div>
  )
}

const CreationInfo = ({ creation }: { creation: Creation }) => {
  const [displayDateTime, setDisplayDateTime] = useState('')

  const { concept, isLoading } = useConcept(
    creation.task.config['lora'] || null,
  )

  useEffect(() => {
    const createdDate = new Date(creation.createdAt)
    const dateString = createdDate.toLocaleDateString()
    const timeString = createdDate.toLocaleTimeString().substring(0, 5)
    setDisplayDateTime(`${dateString} ${timeString}`)
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
          <BaseParamGroup label="Date" value={displayDateTime} />
        </div>
      ) : null}

      {creation.task.config['lora'] ? (
        <div className="mt-4">
          <BaseParamGroup
            label="Concept"
            value={
              isLoading ? (
                <LoadingIndicator />
              ) : concept ? (
                <div>
                  <Link
                    href={`/concepts/${concept._id}`}
                    className="block mb-2"
                  >
                    {concept.user.username}:{concept.conceptName}
                  </Link>
                  <ImageZoomable
                    key={concept.thumbnail}
                    url={concept.thumbnail}
                    width={132}
                    height={132}
                  />
                </div>
              ) : (
                <div className="text-xs text-gray-500">n/a</div>
              )
            }
          />
        </div>
      ) : null}

      {creation.task.config['init_image_data'] ? (
        <div className="mt-4">
          <BaseParamGroup
            label="Init Image"
            value={
              <ImageZoomable
                key={creation.task.config['init_image_data']}
                url={creation.task.config['init_image_data']}
                width={132}
                height={132}
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
              <div className="grid grid-cols-2 gap-2 mt-1">
                {creation.task.config['interpolation_init_images'].map(
                  (initImage: string) => (
                    <ImageZoomable
                      key={initImage}
                      url={initImage}
                      width={134}
                      height={134}
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
