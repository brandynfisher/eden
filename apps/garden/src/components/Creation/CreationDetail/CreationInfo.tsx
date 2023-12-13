import ImageZoomable from '@/components/Creation/CreationInterface/media/ImageZoomable'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useConcept } from '@/hooks/useConcept'
import { Creation } from '@edenlabs/eden-sdk'
import Link from 'next/link'
import React, { ReactNode, useEffect, useState } from 'react'

export const BaseParamGroup = ({
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

const thumbnailSize = 132

const CreationInfo = ({ creation }: { creation: Creation }) => {
  const [displayDateTime, setDisplayDateTime] = useState('')

  const { concept, isLoading } = useConcept(
    creation.task.config['lora'] || null,
  )

  useEffect(() => {
    const createdDate = new Date(creation.createdAt)
    const dateString = createdDate.toLocaleDateString()
    const timeString = createdDate.toLocaleTimeString()
    const timeStringFormatted = timeString.substring(
      0,
      timeString.lastIndexOf(':'),
    )
    setDisplayDateTime(`${dateString} ${timeStringFormatted}`)
  }, [creation.createdAt])

  return (
    <div>
      {creation.task.generator.output === 'creation' ? (
        <div className="flex gap-4 flex-wrap lg:justify-between">
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
                    width={thumbnailSize}
                    height={thumbnailSize}
                  />
                </div>
              ) : (
                <div className="text-xs text-gray-500">n/a</div>
              )
            }
          />
        </div>
      ) : null}

      {creation.task.config['init_image_data'] ||
      creation.task.config['init_image'] ? (
        <div className="mt-4">
          <BaseParamGroup
            label="Init Image"
            value={
              <ImageZoomable
                key={
                  creation.task.config['init_image_data'] ||
                  creation.task.config['init_image']
                }
                url={
                  creation.task.config['init_image_data'] ||
                  creation.task.config['init_image']
                }
                width={thumbnailSize}
                height={thumbnailSize}
              />
            }
          />
        </div>
      ) : null}

      {creation.task.config['control_image'] ? (
        <div className="mt-4">
          <BaseParamGroup
            label="Control Image"
            value={
              <ImageZoomable
                key={creation.task.config['control_image']}
                url={creation.task.config['control_image']}
                width={thumbnailSize}
                height={thumbnailSize}
              />
            }
          />
        </div>
      ) : null}

      {creation.task.config['ip_image'] ? (
        <div className="mt-4">
          <BaseParamGroup
            label="Ip Image"
            value={
              <ImageZoomable
                key={creation.task.config['ip_image']}
                url={creation.task.config['ip_image']}
                width={thumbnailSize}
                height={thumbnailSize}
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
                      width={thumbnailSize}
                      height={thumbnailSize}
                    />
                  ),
                )}
              </div>
            }
          />
        </div>
      ) : null}
    </div>
  )
}

export default CreationInfo
