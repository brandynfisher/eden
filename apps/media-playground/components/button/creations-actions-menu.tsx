import ActionsDropdown from '@/components/button/actions-dropdown'
import DeleteActionItem from '@/components/button/delete-action-item'
import DownloadActionItem from '@/components/button/download-action-item'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import CollectionSelectionDialog from '@/components/dialog/collection-selection-dialog'
import ShareDialog from '@/components/dialog/share-dialog'
import {
  DropdownMenuGroup,
  DropdownMenuItem, // DropdownMenuLabel,
  DropdownMenuSeparator, // DropdownMenuSub,
  // DropdownMenuSubContent,
  // DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  toggleAddToCollectionModal,
  toggleShareDialog,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import {
  BookmarkPlusIcon,
  ExternalLinkIcon,
  FileSlidersIcon,
  Share2Icon, //FilmIcon
} from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

// import { useCostCalculation } from '@/hooks/use-cost-calculation'
// import { useGeneratorQuery } from '@/hooks/query/use-generator-query'
// import { getDefaultNameValueMap } from '@/lib/forms'
// import { MannaValue } from '@/components/header/manna-balance'

type Props = {
  creation: CreationV2
  queryKey: QueryKey
  className?: string
}

const CreationActionsMenu = ({ creation, queryKey, className }: Props) => {
  const { user } = useAuthState()
  const [isOpen, setIsOpen] = useState(false)

  if (!creation) {
    return null
  }

  return (
    <>
      <ActionsDropdown className={className} onOpenChange={setIsOpen}>
        {isOpen && (
          <CreationActionsContent
            creation={creation}
            queryKey={queryKey}
            userId={user?._id}
            isOpen={isOpen}
          />
        )}
      </ActionsDropdown>
      <CollectionSelectionDialog creations={[creation]} />
    </>
  )
}

type ContentProps = {
  creation: CreationV2
  queryKey: QueryKey
  userId?: string
  isOpen?: boolean
}

//
// const QuickActionSubMenuItem = ({ label, config, costEstimateFormula, onClick }: {
//   label: string,
//   config: { [key: string]: string|number },
//   costEstimateFormula: string,
//   onClick: (config: { [key: string]: string|number|boolean }) => void
// }) => {
//   const { calculateCost } = useCostCalculation()
//
//   return (
//     <DropdownMenuItem onClick={() => onClick(config)}>
//       <div className='flex items-center gap-6 w-full cursor-pointer'>
//         {label}
//         <div className='text-xs flex ml-auto font-mono text-muted-foreground'>
//           <MannaValue value={calculateCost(costEstimateFormula || '', config)} />
//         </div>
//       </div>
//     </DropdownMenuItem>
//   )
// }
//
// const QuickActionAnimate = () => {
//   const toolKey = 'img2vid'
//   const { generator } = useGeneratorQuery({ key: toolKey })
//   const defaultNameValueMap = getDefaultNameValueMap(generator?.parameters)
//
//   console.log(toolKey, defaultNameValueMap)
//
//   const handleSubmit = (config: { [key: string]: string|number|boolean }) => {
//     // @todo: submit to create task
//     // @todo: show info toast
//     //
//     console.log({ estimate: generator?.costEstimate, config, final: { ...defaultNameValueMap, ...config } })
//   }
//
//   return (
//     <DropdownMenuSub>
//       <DropdownMenuSubTrigger>
//         <FilmIcon className='mr-2 h-4 w-4' />
//         Animate
//       </DropdownMenuSubTrigger>
//       <DropdownMenuSubContent>
//         <DropdownMenuLabel>Duration</DropdownMenuLabel>
//         <DropdownMenuSeparator />
//         <QuickActionSubMenuItem
//           label={'24 Frames'}
//           costEstimateFormula={generator?.costEstimate || ''}
//           onClick={handleSubmit}
//           config={{ num_frames: 24 }}
//         />
//         <QuickActionSubMenuItem
//           label={'48 Frames'}
//           costEstimateFormula={generator?.costEstimate || ''}
//           onClick={handleSubmit}
//           config={{ num_frames: 48 }}
//         />
//         <QuickActionSubMenuItem
//           label={'64 Frames'}
//           costEstimateFormula={generator?.costEstimate || ''}
//           onClick={handleSubmit}
//           config={{ num_frames: 64 }}
//         />
//       </DropdownMenuSubContent>
//     </DropdownMenuSub>
//   )
// }
//
// const QuickActionAnimate3D = () => {
//   const toolKey = 'animate_3D'
//   const { generator } = useGeneratorQuery({ key: toolKey })
//
//   const baseConfig = {
//     loop: false,
//   }
//
//   const defaultNameValueMap = { ...getDefaultNameValueMap(generator?.parameters), ...baseConfig }
//
//   console.log(toolKey, defaultNameValueMap)
//
//   const handleSubmit = (config: { [key: string]: string|number|boolean }) => {
//     // @todo: submit to create task
//     // @todo: show info toast
//     //
//     console.log({ estimate: generator?.costEstimate, config, final: { ...defaultNameValueMap, ...config } })
//   }
//
//   return (
//     <DropdownMenuSub>
//       <DropdownMenuSubTrigger>
//         <FilmIcon className='mr-2 h-4 w-4' />
//         Animate 3D
//       </DropdownMenuSubTrigger>
//       <DropdownMenuSubContent>
//         <DropdownMenuLabel>Duration</DropdownMenuLabel>
//         <DropdownMenuSeparator />
//         <QuickActionSubMenuItem
//           label={'24 Frames'}
//           costEstimateFormula={generator?.costEstimate || ''}
//           onClick={handleSubmit}
//           config={{ n_frames: 24 }}
//         />
//         <QuickActionSubMenuItem
//           label={'48 Frames'}
//           costEstimateFormula={generator?.costEstimate || ''}
//           onClick={handleSubmit}
//           config={{ n_frames: 48 }}
//         />
//         <QuickActionSubMenuItem
//           label={'64 Frames'}
//           costEstimateFormula={generator?.costEstimate || ''}
//           onClick={handleSubmit}
//           config={{ n_frames: 64 }}
//         />
//       </DropdownMenuSubContent>
//     </DropdownMenuSub>
//   )
// }

const CreationActionsContent = ({
  creation,
  queryKey,
  userId,
  isOpen,
}: ContentProps) => {
  const dispatch = useAppDispatch()

  const { isSignedIn } = useAuthState()
  const { creation: creationResponse } = useCreationQuery({
    key: creation._id,
    initialData: {
      creation,
    },
    enabled: isOpen,
  })

  const creationData = creationResponse || creation

  const handleAddToCollectionClick = () => {
    dispatch(toggleAddToCollectionModal())
  }

  const handleShareClick = () => {
    dispatch(toggleShareDialog())
  }

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link
            className="cursor-pointer"
            href={`/creations/${creationData._id}`}
          >
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            View Details
            {/*<DropdownMenuShortcut>⇧⌘O</DropdownMenuShortcut>*/}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/*<QuickActionAnimate />*/}
        {/*<QuickActionAnimate3D />*/}
        <DropdownMenuItem asChild>
          <Link
            className="cursor-pointer"
            href={`/create/${creationData.mediaAttributes?.type}/${creationData.workflow}?creation=${creationData._id}`}
            scroll={false}
            shallow={true}
          >
            <FileSlidersIcon className="mr-2 h-4 w-4" />
            Use as Preset
            {/*<DropdownMenuShortcut>⇧⌘U</DropdownMenuShortcut>*/}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <button
            type="button"
            className="w-full"
            onClick={handleAddToCollectionClick}
          >
            <BookmarkPlusIcon className="mr-2 h-4 w-4" />
            Add to collection
          </button>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuItem asChild>
        <button type="button" className="w-full" onClick={handleShareClick}>
          <Share2Icon className="mr-2 h-4 w-4" />
          Share
        </button>
      </DropdownMenuItem>
      {creationData.user._id === userId && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <PrivacyActionItem
              type="creation"
              item={creationData}
              queryKey={queryKey}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DeleteActionItem
              type="creation"
              item={creationData}
              queryKey={queryKey}
            />
          </DropdownMenuGroup>
        </>
      )}
      {isSignedIn ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DownloadActionItem
              type="creation"
              originalFileUrl={creationData.url || ''}
              saveAsFileName={`${creationData.user.username}${
                creationData.args.prompt
                  ? `_${creationData.args.prompt
                      .substring(0, 64)
                      .trim()
                      .replace(/\s+/g, '-')}`
                  : ``
              }_${creationData._id}`}
            />
          </DropdownMenuGroup>
        </>
      ) : null}
    </>
  )
}

export default CreationActionsMenu
