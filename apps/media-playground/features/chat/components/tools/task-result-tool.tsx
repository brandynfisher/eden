import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import { ToolFallback } from '@/features/chat/components/tools/tool-fallback'
import { getFileTypeByMimeType } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { makeAssistantToolUI } from '@assistant-ui/react'
import { TaskV2Result, TaskV2Status, ToolV2 } from '@edenlabs/eden-sdk'
import React from 'react'

export type TaskResultToolArgs = {
  // result: {
  tool: ToolV2['key']
  result: TaskV2Result[]
  status: TaskV2Status
  error?: string
  // }
}

export const TaskResultTool = makeAssistantToolUI<
  TaskResultToolArgs,
  TaskResultToolArgs
>({
  toolName: 'task_result',
  render: ({ args, argsText, status, result }) => {
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
          addResult={() => console.log('adding result', result)}
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
                      <div key={output.filename}>
                        {getFileTypeByMimeType(
                          output.mediaAttributes?.mimeType,
                        ) === 'audio' ? (
                          <audio controls className="w-full max-w-2xl">
                            <source
                              src={getCloudfrontOriginalUrl(output.filename)}
                              type={output.mediaAttributes?.mimeType}
                            />
                          </audio>
                        ) : (
                          <LightboxTrigger
                            // className="w-full h-full"
                            slide={{
                              url: getCloudfrontOriginalUrl(output.filename),
                              thumbnail: getCloudfrontOriginalUrl(
                                output.filename,
                              ),
                              width: output.mediaAttributes?.width,
                              height: output.mediaAttributes?.height,
                              duration:
                                output.mediaAttributes?.duration || undefined,
                            }}
                            imageProps={{
                              // blurhash: output.mediaAttributes?.blurhash,
                              className: 'max-h-[420px]',
                            }}
                            videoProps={{
                              className: 'max-h-[420px]',
                            }}
                          />
                        )}
                      </div>
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
