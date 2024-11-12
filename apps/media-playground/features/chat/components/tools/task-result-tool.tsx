import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
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
          {resultsArray
            ? resultsArray.map((result, index) => (
                <div key={index}>
                  <LightboxGalleryItem
                    className="w-full h-full"
                    item={{
                      url: result.url,
                      thumbnail: result.url,
                      width: result.mediaAttributes?.width,
                      height: result.mediaAttributes?.height,
                      duration: result.mediaAttributes?.duration || undefined,
                    }}
                  />
                </div>
              ))
            : null}
        </LightboxGallery>
      </div>
    )
  },
})
