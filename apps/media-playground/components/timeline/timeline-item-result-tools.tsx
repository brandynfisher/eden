import CreationActionsMenu from '@/components/button/creations-actions-menu'
import ModelActionsMenu from '@/components/button/model-actions-menu'
import TaskActionsMenu from '@/components/button/task-actions-menu'
import LoadingIndicator from '@/components/loading-indicator'
import ParameterTable from '@/components/timeline/parameter-table'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import PrivacyToggle from '@/features/detail/privacy-toggle'
import { cn } from '@/lib/utils'
import {
  TaskV2,
  TaskV2Result,
  TasksV2PublishResponse,
} from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { BookHeartIcon, ListIcon } from 'lucide-react'
import Link from 'next/link'
import React, { Suspense, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  task: TaskV2
  result: TaskV2Result
  index: number
  queryKey: QueryKey
  className?: string
}

const TimelineItemResultTools = ({
  task,
  result,
  index,
  queryKey,
  className,
}: Props) => {
  const [isPublishing, setIsPublishing] = useState(false)
  const publishTaskResult = async (taskId: string, originalFileUrl: string) => {
    setIsPublishing(true)
    const publishToast = toast(
      <div className="flex gap-2 items-center justify-center">
        <LoadingIndicator className="h-6" />
        Saving creation...
      </div>,
      { dismissible: true },
    )

    try {
      const response: AxiosResponse<TasksV2PublishResponse> = await axios.post(
        `/api/tasks/publish`,
        {
          taskId,
          resultFilename: originalFileUrl,
        },
      )

      const responseData = response.data

      // console.log({ responseData })

      toast.success(`Saved`, {
        id: publishToast,
        description: 'Creation was added to your profile',
        action: {
          label: (
            <Link href={`/creations/${responseData?.creation?._id}`}>Show</Link>
          ),
          onClick: () =>
            console.log(`/creations/${responseData?.creation?._id}`),
        },
        dismissible: true,
        richColors: true,
      })
    } catch (e: unknown) {
      toast.error(`Failed to save`, {
        id: publishToast,
        description: JSON.stringify(
          (e as AxiosError<{ message: string }>)?.response?.data?.message,
        ),
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div
      data-test-id="timeline-item-result-tools"
      className={cn([
        `relative text-sm p-2 rounded-b-lg bg-muted/60`,
        className,
      ])}
    >
      <Collapsible>
        <div className="flex flex-wrap gap-2">
          {task.output_type !== 'lora' && !result.published ? (
            <Button
              variant={result.published ? 'ghost' : 'outline'}
              size="sm"
              title={
                result.published
                  ? 'Creation was saved'
                  : `Save creation to profile`
              }
              className={`px-2 flex gap-2 items-center justify-center ${
                result.published ? 'cursor-default' : ''
              }`}
              onClick={
                result.published
                  ? undefined
                  : () =>
                      publishTaskResult(
                        task._id,
                        result.filename || result.url || '',
                      )
              }
              disabled={isPublishing}
            >
              {!result.published ? (
                <>
                  <BookHeartIcon size={20} />
                  Save
                </>
              ) : isPublishing ? (
                <>
                  <LoadingIndicator className="h-4 w-4" />
                  Saving
                </>
              ) : null}
            </Button>
          ) : (
            <>
              {result.model ? (
                <PrivacyToggle
                  queryKey={queryKey}
                  type={'model'}
                  item={result.model}
                  // onUpdate={() => {
                  //   // @todo: mutate/invalidate/optimistic update
                  //   console.log('should set private')
                  // }}
                />
              ) : null}
              {result.creation ? (
                <PrivacyToggle
                  queryKey={queryKey}
                  type={'creation'}
                  item={result.creation}
                  // onUpdate={() => {
                  //   // @todo: mutate/invalidate/optimistic update
                  //   console.log('should set private')
                  // }}
                />
              ) : null}
            </>
          )}
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              title="Show task configuration"
              className="px-2"
            >
              <ListIcon size={20} />
            </Button>
          </CollapsibleTrigger>
          <Suspense>
            {task.output_type === 'lora' && result.model ? (
              <ModelActionsMenu
                model={result.model}
                className="ml-auto"
                queryKey={queryKey}
              />
            ) : result.creation ? (
              <CreationActionsMenu
                creation={result.creation}
                className="ml-auto"
                queryKey={queryKey}
              />
            ) : (
              <TaskActionsMenu
                task={task}
                result={result}
                index={index}
                className="ml-auto"
                // queryKey={queryKey}
              />
            )}
          </Suspense>
        </div>
        <CollapsibleContent>
          <div className="mt-2">
            <ParameterTable args={task.args} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default TimelineItemResultTools
