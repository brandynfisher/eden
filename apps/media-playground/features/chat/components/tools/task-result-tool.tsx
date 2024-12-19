import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
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
  render: ({ args, argsText, status, result }) => {
    // render: ({ result }) => {
    // console.log(toolCallId, toolName, args, argsText, status, result)
    const { tool, result: toolResults } = result as TaskResultToolArgs

    return (
      <div className="mb-2">
        <ToolFallback
          type="tool-call"
          result={result}
          toolCallId={tool}
          toolName={tool}
          args={args}
          argsText={argsText}
          status={status}
          addResult={() => console.log('adding result ')}
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
                  <div className="relative" key={index}>
                    {result.output.map(output => (
                      <LightboxTrigger
                        key={output.filename}
                        className="w-full h-full"
                        slide={{
                          url: getCloudfrontOriginalUrl(output.filename),
                          thumbnail: getCloudfrontOriginalUrl(output.filename),
                          width: output.mediaAttributes?.width,
                          height: output.mediaAttributes?.height,
                          duration:
                            output.mediaAttributes?.duration || undefined,
                        }}
                        imageProps={{
                          blurhash: output.mediaAttributes?.blurhash,
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
