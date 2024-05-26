import CreationImageActions from '@/components/Creation/CreationDetail/CreationImageActions'
import ImageZoomable from '@/components/Creation/CreationInterface/media/ImageZoomable'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useConcept } from '@/hooks/useConcept'
import { isImageUrl } from '@/lib/string'
import { Creation } from '@edenlabs/eden-sdk'
import { Divider } from 'antd'
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
      <div className="text-gray-400 text-xs mb-2">{label}</div>
      <div>
        {Array.isArray(value) ? (
          <div title={value?.toString()}>{JSON.stringify(value)}</div>
        ) : (
          <div
            className="text-xs"
            title={typeof value === 'string' ? value?.toString() : ''}
          >
            {value}
          </div>
        )}
      </div>
    </div>
  )
}

const thumbnailSize = 128

const CreationInfo = ({ creation }: { creation: Creation }) => {
  const [displayDateTime, setDisplayDateTime] = useState('')

  const { concept, isLoading } = useConcept(
    creation.task.config['lora'] || null,
    {
      shouldRetryOnError: false,
    },
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
        <div>
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
          {isImageUrl(creation.uri) ? (
            <>
              <Divider className="my-4" />
              <CreationImageActions creation={creation} />
            </>
          ) : null}
        </div>
      ) : null}

      {creation.task.config['lora'] ? (
        <div className="mt-4">
          <BaseParamGroup
            label="Model"
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
                    url={concept.thumbnail || ''}
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

      {creation.task.config['input_images'] &&
      creation.task.config['input_images'].length ? (
        <div className="mt-4">
          <BaseParamGroup
            label="Input Images"
            value={
              <div className="grid grid-cols-2 gap-2 mt-1">
                {creation.task.config['input_images'].map(
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

      {creation.task.config['mask_images'] &&
      creation.task.config['mask_images'].length ? (
        <div className="mt-4">
          <BaseParamGroup
            label="Mask Images"
            value={
              <div className="grid grid-cols-2 gap-2 mt-1">
                {creation.task.config['mask_images'].map(
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
