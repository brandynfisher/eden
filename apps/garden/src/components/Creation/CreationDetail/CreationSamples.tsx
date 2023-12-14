import ResultPreviewDisplay from '@/components/Creation/CreationInterface/Timeline/ResultPreviewDisplay'
import ConfigParamsTabs from '@/components/Detail/ConfigParamsTabs'
import { Creation } from '@edenlabs/eden-sdk'
import React from 'react'

const CreationSamples = ({ creation }: { creation: Creation }) => {
  return (
    <>
      {creation.samples && creation.samples.length ? (
        <div>
          <div className="relative mb-2 col-span-8 p-2 border border-gray-300 dark:border-gray-800 border-solid rounded-lg">
            <div className="text-gray-400 text-sm mb-2">Variations</div>
            <div className="grid grid-cols-2 gap-2 flex-wrap">
              {creation.samples.map(creationSampleId => (
                <div key={creationSampleId}>
                  <ResultPreviewDisplay creationId={creationSampleId} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <ConfigParamsTabs data={creation} />
    </>
  )
}

export default CreationSamples
