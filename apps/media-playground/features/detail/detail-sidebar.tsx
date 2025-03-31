import CreationActionsMenu from '@/components/button/creations-actions-menu'
import ModelActionsMenu from '@/components/button/model-actions-menu'
import ModelMiniCard from '@/components/card/model-mini-card'
import LoadingIndicator from '@/components/loading-indicator'
import CopyTextButton from '@/components/text/copy-text-button'
import TextClampMore from '@/components/text/text-clamp-more'
import ParameterTable from '@/components/timeline/parameter-table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import UserAvatarLink from '@/components/user/user-avatar-link'
import AgentLink from '@/features/agent/agent-link'
import PrivacyToggle from '@/features/detail/privacy-toggle'
import { useAuthState } from '@/hooks/use-auth-state'
import { getFileTypeByMimeType } from '@/lib/files'
import { cn } from '@/lib/utils'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { ComponentIcon } from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import Link from 'next/link'
import React, { Suspense } from 'react'

type Props = {
  item?: CreationV2 | ModelV2
  type: 'creation' | 'model'
  queryKey: QueryKey
  inModal?: boolean
}

const DetailSidebar = ({ item, type, queryKey, inModal }: Props) => {
  const { user: creator } = item || {}
  const { prompt, text_input, prompt_text, lora, lora2, ...remainingArgs } =
    item?.task.args || {}
  const { TimeAgo } = useTimeAgo()
  const { user } = useAuthState()

  return (
    <div
      className={cn([
        `flex-shrink-0 w-full lg:w-[388px] bg-accent rounded-md rounded-tr-none rounded-br-none`,
        inModal ? '' : 'mb-4',
      ])}
    >
      <div className={cn(['h-full px-4'])}>
        <div className="pt-4 pb-3">
          {item ? (
            <div>
              <div className="flex">
                <UserAvatarLink
                  name={item.user.username || item.user._id}
                  image={item.user.userImage}
                  isAgent={item?.user?.type === 'agent'}
                />
                <Suspense>
                  {type === 'creation' ? (
                    <CreationActionsMenu
                      creation={item as CreationV2}
                      queryKey={queryKey}
                      className="ml-auto"
                    />
                  ) : (
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
        item &&
        (item as CreationV2).agent &&
        (item as CreationV2).agent?._id !== item.user._id ? (
          <div className="pb-4 text-sm">
            <div className="h-9 flex items-center justify-between font-bold">
              Made with
            </div>
            <AgentLink agent={(item as CreationV2).agent} hideName={false} />
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

        {type === 'creation' ? (
          <div className="pb-4 text-sm">
            <div className="h-9 flex items-center justify-between font-bold">
              Tool
            </div>
            {item && (item as CreationV2).tool ? (
              <Link
                href={`/create/${getFileTypeByMimeType(
                  (item as CreationV2).mediaAttributes?.mimeType,
                )}/${(item as CreationV2).tool}`}
              >
                {(item as CreationV2).tool}
              </Link>
            ) : (
              <Skeleton className="h-5 w-[125px]" />
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
              {prompt || text_input || prompt_text ? (
                <CopyTextButton
                  title={'Prompt'}
                  text={prompt || text_input || prompt_text || ''}
                />
              ) : null}
            </div>
            {item ? (
              <TextClampMore
                text={prompt || text_input || prompt_text || '-'}
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

        {lora ? (
          <div>
            <div className="font-bold text-sm mb-3">Model</div>
            <Suspense fallback={<LoadingIndicator />}>
              <ModelMiniCard modelId={lora} className="bg-popover">
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/create/image/${
                      (item as CreationV2).tool
                    }?lora=${lora}`}
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

        {lora2 ? (
          <div>
            <div className="font-bold text-sm mb-3 mt-4">Model 2</div>
            <Suspense fallback={<LoadingIndicator />}>
              <ModelMiniCard modelId={lora2} className="bg-popover">
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/create/image/${
                      (item as CreationV2).tool
                    }?lora2=${lora2}`}
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

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="parameters" className="!border-b-0">
            <AccordionTrigger className="hover:no-underline">
              <div className="font-bold text-sm">Parameters</div>
            </AccordionTrigger>
            <AccordionContent>
              {item && remainingArgs ? (
                <ParameterTable
                  taskId={item.task._id?.toString()}
                  args={remainingArgs}
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

export default DetailSidebar
