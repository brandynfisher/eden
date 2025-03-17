import { Button } from '@/components/ui/button'
import DialogContentOverlayBlur from '@/components/ui/custom/dialog-content-overlay-blur'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ArrowLeftIcon, PlusIcon } from 'lucide-react'
import * as React from 'react'
import { PropsWithChildren } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: ToolV2
} & PropsWithChildren

const CreationUiMobile = ({ open, onOpenChange, tool, children }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <div className="lg:hidden fixed bottom-0 flex z-10 bg-accent p-2 w-full justify-between items-center gap-2">
          <div className="text-sm text-muted-foreground">{tool.name}</div>
          <Button onClick={() => onOpenChange(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Create
          </Button>
        </div>
      </DialogTrigger>
      <DialogContentOverlayBlur className="p-0 rounded-md overflow-hidden bg-muted-darker">
        <VisuallyHidden>
          <DialogTitle>{tool.name}</DialogTitle>
          <DialogDescription>Creation UI</DialogDescription>
        </VisuallyHidden>

        {children}

        <DialogClose
          autoFocus
          className="absolute w-9 h-9 top-0 left-0 rounded-t-none rounded-l-none flex items-center justify-center lg:left-2 lg:right-auto lg:top-2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none bg-accent data-[state=open]:text-muted-foreground"
        >
          <ArrowLeftIcon className="h-8 w-8" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContentOverlayBlur>
    </Dialog>
  )
}

export default CreationUiMobile
