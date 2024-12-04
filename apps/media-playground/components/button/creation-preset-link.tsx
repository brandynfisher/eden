import { CreationV2 } from '@edenlabs/eden-sdk'
import { FileSlidersIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  creation: CreationV2
  hideLabel?: boolean
}

export const CreationPresetLink = ({ creation, hideLabel }: Props) => {
  return (
    <Link
      className="cursor-pointer"
      href={`/create/${creation.mediaAttributes?.type}/${creation.tool}?creation=${creation._id}`}
      scroll={false}
      shallow={true}
    >
      <FileSlidersIcon className="mr-2 h-4 w-4" />
      {hideLabel ? null : 'Use as Preset'}
      {/*<DropdownMenuShortcut>⇧⌘U</DropdownMenuShortcut>*/}
    </Link>
  )
}
