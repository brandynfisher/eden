import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { makeAssistantToolUI } from '@assistant-ui/react'
import { TaskV2Result } from '@edenlabs/eden-sdk'
import React from 'react'

type TaskResultToolArgs = {
  result: TaskV2Result[]
}

export const TaskResultTool = makeAssistantToolUI<TaskResultToolArgs, string>({
  toolName: 'task_result',
  // render: ({ toolCallId, toolName, args, argsText, status, result }) => {
  render: ({ result }) => {
    const resultsArray = result
      ? (JSON.parse(result) as TaskV2Result[])
      : undefined

    return (
      <div className="relative mb-2">
        <LightboxGallery>
          <div
            className={cn([
              resultsArray && resultsArray.length > 1 && 'grid',
              'grid-cols-2 gap-4',
            ])}
          >
            {resultsArray
              ? resultsArray.map((result, index) => (
                  <div key={index}>
                    <LightboxTrigger
                      className="w-full h-full"
                      slide={{
                        url: getCloudfrontOriginalUrl(result.url),
                        thumbnail: getCloudfrontOriginalUrl(result.url),
                        width: result.mediaAttributes?.width,
                        height: result.mediaAttributes?.height,
                        duration: result.mediaAttributes?.duration || undefined,
                      }}
                    />
                  </div>
                ))
              : null}
          </div>
        </LightboxGallery>
      </div>
    )
  },
})
