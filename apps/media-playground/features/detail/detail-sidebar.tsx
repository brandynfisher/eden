import LikeButton from '../../components/button/like-button'
import ModelActionsMenu from '@/components/button/model-actions-menu'
import ModelMiniCard from '@/components/card/model-mini-card'
import LoadingIndicator from '@/components/loading-indicator'
import CopyTextButton from '@/components/text/copy-text-button'
import TextClampMore from '@/components/text/text-clamp-more'
import ParameterTable from '@/components/timeline/parameter-table'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import UserAvatarLink from '@/components/user/user-avatar-link'
import AgentLink from '@/features/agent/agent-link'
import PrivacyToggle from '@/features/detail/privacy-toggle'
import { useTaskQuery } from '@/hooks/query/use-task-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useDeleteMutation } from '@/hooks/use-delete-mutation'
import { getFileTypeByMimeType } from '@/lib/files'
import { downloadFile } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import {
  updateAddToCollectionModal,
  updateDeleteDialog,
  updateShareModal,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { generateFilename } from '@/utils/slug.util'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import {
  BookmarkPlusIcon,
  ChevronDownIcon,
  ComponentIcon,
  DownloadIcon,
  Share2Icon,
  TrashIcon,
} from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import Link from 'next/link'
import React, { Suspense, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  item?: CreationV2 | ModelV2
  type: 'creation' | 'model'
  queryKey: QueryKey
  inModal?: boolean
}

const DetailSidebar = ({ item, type, queryKey, inModal }: Props) => {
  const { user: creator } = item || {}
  const creationItem = type === 'creation' ? (item as CreationV2) : undefined
  const { prompt, text_input, prompt_text, lora, lora2, ...remainingArgs } =
    item?.task.args || {}
  const { TimeAgo } = useTimeAgo()
  const { user, isSignedIn } = useAuthState()
  const dispatch = useAppDispatch()
  const [selectedArgsIndex, setSelectedArgsIndex] = useState<number>(0) // 0 = main args, 1+ = subtool indices
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const { mutate: deleteMutation } = useDeleteMutation({
    type: type as 'creation' | 'model',
    queryKey: queryKey,
  })

  const isOwner = item?.user?._id === user?._id

  // Fetch the full task data to get results with subtool_calls
  const taskId =
    type === 'creation' && item ? (item as CreationV2).task._id : undefined
  const { task: fullTaskData } = useTaskQuery({
    key: taskId as string,
    enabled: !!taskId && type === 'creation',
  })

  // Extract subtool_calls from the task result if they exist (only for creations)
  // Use the full task data if available, otherwise fall back to embedded task
  const taskWithResults =
    fullTaskData ||
    (type === 'creation' ? (item as CreationV2)?.task : undefined)
  const taskResults = taskWithResults?.result
  const subtoolCalls: Array<{ tool: string; args?: Record<string, unknown> }> =
    taskResults?.[0]?.subtool_calls || []
  const hasSubtools = subtoolCalls.length > 0

  // Determine current args to display based on selected index
  const getCurrentArgs = () => {
    if (selectedArgsIndex === 0) {
      // Main tool args
      return { prompt, text_input, prompt_text, lora, lora2, ...remainingArgs }
    } else {
      // Subtool args
      const subtool = subtoolCalls[selectedArgsIndex - 1]
      if (!subtool) return {}
      const {
        lora: subtoolLora,
        lora2: subtoolLora2,
        ...subtoolRemainingArgs
      } = subtool.args || {}
      return {
        prompt:
          subtool.args?.prompt ||
          subtool.args?.text_input ||
          subtool.args?.prompt_text,
        lora: subtoolLora,
        lora2: subtoolLora2,
        ...subtoolRemainingArgs,
      }
    }
  }

  const currentArgs = getCurrentArgs()
  const {
    prompt: currentPrompt = undefined,
    text_input: currentTextInput = undefined,
    prompt_text: currentPromptText = undefined,
    lora: currentLora = undefined,
    lora2: currentLora2 = undefined,
    ...currentRemainingArgs
  } = currentArgs as Record<string, unknown>

  const handleShareClick = () => {
    if (!item) return
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/${type}s/${item._id}`
    dispatch(
      updateShareModal({
        isOpen: true,
        shareUrl: shareUrl,
      }),
    )
  }

  const handleAddToCollectionClick = () => {
    if (!item || type !== 'creation') return
    dispatch(
      updateAddToCollectionModal({
        isOpen: true,
        creationIds: [item._id],
      }),
    )
  }

  const handleDownloadClick = async () => {
    if (!item || type !== 'creation') return
    const creation = item as CreationV2
    if (!creation.filename) return

    const saveAsFileName = generateFilename(
      creation.user?.username || '',
      creation.task?.args?.prompt?.substring(0, 64).trim() || '',
      creation._id || '',
    )

    await downloadFile(
      getCloudfrontOriginalUrl(creation.filename),
      `Eden_creation_${saveAsFileName}`,
    )

    toast.info(`Downloading...`, {
      description: `creation: ${saveAsFileName}`,
      dismissible: true,
      richColors: true,
      duration: 500,
    })
  }

  const handleDelete = () => {
    if (!isOwner || !item) return

    dispatch(
      updateDeleteDialog({
        isOpen: true,
        title: `Delete ${type}`,
        description: `Are you sure you want to delete this ${type}?`,
        onDelete: () => {
          deleteMutation({ ids: [item._id], deleted: true })
        },
      }),
    )
  }

  return (
    <div
      className={cn([
        `flex-shrink-0 w-full lg:w-[388px] bg-accent rounded-md rounded-tr-none rounded-br-none`,
        inModal ? '' : 'mb-4',
      ])}
    >
      <div className={cn(['h-full px-4 text-sm sm:text-base leading-relaxed'])}>
        <div className="pt-4 pb-3">
          {item ? (
            <div>
              {type === 'creation' && (
                <TooltipProvider delayDuration={0}>
                  <div className="flex items-center justify-between mb-4 p-2 rounded-md bg-popover border">
                    <div className="flex items-center gap-2">
                      <LikeButton
                        type={type}
                        id={item._id}
                        isLiked={item.isLiked}
                        likeCount={item.likeCount}
                        disabled={!isSignedIn}
                      />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={handleShareClick}
                          >
                            <Share2Icon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Share</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={handleAddToCollectionClick}
                            disabled={!isSignedIn}
                          >
                            <BookmarkPlusIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add to Collection</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={handleDownloadClick}
                            disabled={!isSignedIn}
                          >
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {isOwner && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-destructive hover:text-destructive"
                            onClick={handleDelete}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>
              )}
              <div className="flex">
                <UserAvatarLink
                  name={item.user.username || item.user._id}
                  image={item.user.userImage}
                  isAgent={item?.user?.type === 'agent'}
                />
                <Suspense>
                  {type === 'model' && (
                    <ModelActionsMenu
                      model={item as ModelV2}
                      queryKey={queryKey}
                      className="ml-auto"
                    />
                  )}
                </Suspense>
              </div>
              <div
                className="text-xs text-foreground/70 mt-2"
                title={item.createdAt?.toLocaleString()}
              >
                <TimeAgo date={item.createdAt} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-8 w-[250px]" />
              <Skeleton className="h-5 w-[100px] mb-2.5" />
            </div>
          )}
        </div>

        {type === 'creation' &&
        creationItem &&
        creationItem.agent &&
        creationItem.agent._id &&
        creationItem.agent._id !== creationItem.user._id &&
        (creationItem.agent.name ||
          creationItem.agent.username ||
          creationItem.agent.userImage) ? (
          <div className="pb-4 text-sm">
            <div className="h-9 flex items-center justify-between font-bold">
              Made with
            </div>
            <AgentLink agent={creationItem.agent} hideName={false} />
          </div>
        ) : null}

        {creator?._id === user?._id ? (
          <div className="pb-3">
            {item && item.public !== undefined ? (
              <PrivacyToggle
                type={type}
                item={item}
                queryKey={queryKey}
                className="h-9 max-w-fit"
              />
            ) : (
              <Skeleton className="h-[42px] w-[142px]" />
            )}
          </div>
        ) : null}

        {type === 'model' ? (
          <>
            <div className="pb-4 text-sm">
              <div className="h-9 flex items-center justify-between font-bold">
                Name
              </div>
              {item && (item as ModelV2).name ? (
                (item as ModelV2).name
              ) : (
                <Skeleton className="h-5 w-[125px]" />
              )}
            </div>
            <div className="pb-4 text-sm">
              <div className="h-9 flex items-center justify-between font-bold">
                Base Model
              </div>
              {item && (item as ModelV2).base_model ? (
                (item as ModelV2).base_model
              ) : (
                <Skeleton className="h-5 w-[125px]" />
              )}
            </div>
            <div className="pb-4 text-sm">
              <div className="h-9 flex items-center justify-between">
                <div className="font-bold">Trigger Text</div>
                {item &&
                (item as ModelV2).lora_trigger_text &&
                !Array.isArray(
                  (item as ModelV2).lora_trigger_text as unknown,
                ) ? (
                  <CopyTextButton
                    title={'Trigger Text'}
                    text={String((item as ModelV2).lora_trigger_text)}
                  />
                ) : null}
              </div>
              {item && (item as ModelV2).lora_trigger_text ? (
                Array.isArray(
                  (item as ModelV2).lora_trigger_text as unknown,
                ) ? (
                  <ol className="list-decimal list-decimal-inside ml-4 text-muted-foreground">
                    {(
                      (item as ModelV2).lora_trigger_text as unknown as string[]
                    ).map((text, index) => (
                      <li
                        key={index}
                        className="flex items-start justify-between group"
                      >
                        <TextClampMore text={text || '-'} />
                        <div className="opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0">
                          <CopyTextButton title={'Trigger Text'} text={text} />
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <TextClampMore
                    text={String((item as ModelV2).lora_trigger_text) || '-'}
                  />
                )
              ) : (
                <div className="space-y-1">
                  <Skeleton className="h-5 w-[250px]" />
                  <Skeleton className="h-5 w-[250px]" />
                  <Skeleton className="h-5 w-[250px]" />
                </div>
              )}
            </div>
            {!item ? (
              <div className="pb-4 text-sm">
                <div className="h-9 flex items-center justify-between">
                  <div className="font-bold">Thumbnail Prompts</div>
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-5 w-[250px]" />
                  <Skeleton className="h-5 w-[250px]" />
                  <Skeleton className="h-5 w-[250px]" />
                </div>
              </div>
            ) : (item as ModelV2).thumbnail_prompts ? (
              <div className="pb-4 text-sm">
                <div className="h-9 flex items-center justify-between">
                  <div className="font-bold">Thumbnail Prompts</div>
                </div>
                {Array.isArray((item as ModelV2).thumbnail_prompts) ? (
                  <ol className="list-decimal list-decimal-inside ml-4 text-muted-foreground">
                    {((item as ModelV2).thumbnail_prompts as string[]).map(
                      (prompt, index) => (
                        <li key={index} className="">
                          <TextClampMore text={prompt || '-'} />
                        </li>
                      ),
                    )}
                  </ol>
                ) : (
                  <div className="flex items-start justify-between">
                    <TextClampMore
                      text={String((item as ModelV2).thumbnail_prompts) || '-'}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </>
        ) : null}

        {type === 'creation' ? (
          <div className="pb-4 text-sm">
            <div className="h-9 flex items-center justify-between">
              <div className="font-bold">Prompt</div>
              {currentPrompt || currentTextInput || currentPromptText ? (
                <CopyTextButton
                  title={'Prompt'}
                  text={String(
                    currentPrompt ||
                      currentTextInput ||
                      currentPromptText ||
                      '',
                  )}
                />
              ) : null}
            </div>
            {item ? (
              <TextClampMore
                text={String(
                  currentPrompt || currentTextInput || currentPromptText || '-',
                )}
              />
            ) : (
              <div className="space-y-1">
                <Skeleton className="h-5 w-[250px]" />
                <Skeleton className="h-5 w-[250px]" />
                <Skeleton className="h-5 w-[250px]" />
              </div>
            )}
          </div>
        ) : null}

        {currentLora && typeof currentLora === 'string' ? (
          <div>
            <div className="font-bold text-sm mb-3">Model</div>
            <Suspense fallback={<LoadingIndicator />}>
              <ModelMiniCard modelId={currentLora} className="bg-popover">
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/studio/image/${
                      (item as CreationV2).tool
                    }?lora=${currentLora}`}
                    className="ml-auto mr-2"
                    scroll={false}
                    shallow={true}
                  >
                    <ComponentIcon className="mr-2 h-4 w-4" />
                    Use
                  </Link>
                </Button>
              </ModelMiniCard>
            </Suspense>
          </div>
        ) : null}

        {currentLora2 && typeof currentLora2 === 'string' ? (
          <div>
            <div className="font-bold text-sm mb-3 mt-4">Model 2</div>
            <Suspense fallback={<LoadingIndicator />}>
              <ModelMiniCard modelId={currentLora2} className="bg-popover">
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/studio/image/${
                      (item as CreationV2).tool
                    }?lora2=${currentLora2}`}
                    className="ml-auto mr-2"
                    scroll={false}
                    shallow={true}
                  >
                    <ComponentIcon className="mr-2 h-4 w-4" />
                    Use
                  </Link>
                </Button>
              </ModelMiniCard>
            </Suspense>
          </div>
        ) : null}

        {/* Tool and Parameters - for creations */}
        {type === 'creation' ? (
          <div className="w-full mt-2 space-y-2">
            {/* Tool display */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Tool:</span>
              {item && (item as CreationV2).tool ? (
                <Link
                  href={`/studio/${getFileTypeByMimeType(
                    (item as CreationV2).mediaAttributes?.mimeType,
                  )}/${(item as CreationV2).tool}`}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {(item as CreationV2).tool}
                </Link>
              ) : (
                <Skeleton className="h-5 w-[100px]" />
              )}
            </div>

            {/* Parameters Collapsible */}
            <Collapsible
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <span>Parameters</span>
                  <ChevronDownIcon
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isDetailsOpen && 'rotate-180',
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pb-4 space-y-3">
                  {/* Subtool Navigation - inside parameters */}
                  {hasSubtools && (
                    <div className="flex flex-row items-center gap-2 flex-wrap">
                      <ToggleGroup
                        type="single"
                        value={selectedArgsIndex.toString()}
                        onValueChange={value => {
                          if (value) setSelectedArgsIndex(parseInt(value))
                        }}
                        className="flex flex-row items-center gap-2 justify-start flex-wrap"
                      >
                        <ToggleGroupItem
                          value="0"
                          variant="outline"
                          size="sm"
                          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:bg-muted/30 data-[state=off]:text-muted-foreground hover:bg-muted/50 transition-colors"
                        >
                          {(item as CreationV2).tool}
                        </ToggleGroupItem>
                        <span className="text-muted-foreground text-xs px-1">
                          →
                        </span>
                        {subtoolCalls.map((subtool, index) => (
                          <ToggleGroupItem
                            key={index}
                            value={(index + 1).toString()}
                            variant="outline"
                            size="sm"
                            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:bg-muted/30 data-[state=off]:text-muted-foreground hover:bg-muted/50 transition-colors"
                          >
                            {subtool.tool}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  )}

                  {/* Parameter Table */}
                  {item && currentRemainingArgs ? (
                    <ParameterTable
                      taskId={
                        selectedArgsIndex === 0
                          ? item.task._id?.toString()
                          : undefined
                      }
                      cost={
                        selectedArgsIndex === 0 ? item.task.cost : undefined
                      }
                      args={currentRemainingArgs}
                    />
                  ) : (
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-[250px]" />
                      <Skeleton className="h-5 w-[250px]" />
                      <Skeleton className="h-5 w-[200px]" />
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : (
          <div className="w-full">
            {item && currentRemainingArgs ? (
              <ParameterTable
                taskId={
                  selectedArgsIndex === 0
                    ? item.task._id?.toString()
                    : undefined
                }
                cost={selectedArgsIndex === 0 ? item.task.cost : undefined}
                args={currentRemainingArgs}
              />
            ) : (
              <div className="space-y-1">
                <Skeleton className="h-5 w-[250px]" />
                <Skeleton className="h-5 w-[250px]" />
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-5 w-[180px]" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailSidebar
