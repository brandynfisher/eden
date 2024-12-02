import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import { ToolFallback } from '@/features/chat/components/tools/tool-fallback'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { makeAssistantToolUI } from '@assistant-ui/react'
import { TaskV2Result, ToolV2 } from '@edenlabs/eden-sdk'
import React from 'react'

type TaskResultToolArgs = {
  // result: {
  tool: ToolV2['key']
  result: TaskV2Result[]
  // }
}

export const TaskResultTool = makeAssistantToolUI<
  TaskResultToolArgs,
  TaskResultToolArgs
>({
  toolName: 'task_result',
  render: ({ toolCallId, toolName, args, argsText, status, result }) => {
    // render: ({ result }) => {
    console.log(toolCallId, toolName, args, argsText, status, result)
    const { tool, result: toolResults } = result as TaskResultToolArgs

    return (
      <div className="relative mb-2">
        <ToolFallback
          type="tool-call"
          result={result}
          toolCallId={toolCallId}
          toolName={tool}
          args={args}
          argsText={argsText}
          status={status}
          addResult={() => console.log('adding result')}
        />
        <LightboxGallery>
          <div
            className={cn([
              toolResults && toolResults.length > 1 && 'grid',
              'grid-cols-2 gap-4',
            ])}
          >
            {toolResults
              ? toolResults.map((result, index) => (
                  <div key={index}>
                    {result.output.map(output => (
                      <LightboxGalleryItem
                        key={output.filename}
                        className="w-full h-full"
                        item={{
                          url: getCloudfrontOriginalUrl(output.url),
                          thumbnail: getCloudfrontOriginalUrl(output.url),
                          width: output.mediaAttributes?.width,
                          height: output.mediaAttributes?.height,
                          duration:
                            output.mediaAttributes?.duration || undefined,
                        }}
                      />
                    ))}
                  </div>
                ))
              : null}
          </div>
        </LightboxGallery>
      </div>
    )
  },
})
