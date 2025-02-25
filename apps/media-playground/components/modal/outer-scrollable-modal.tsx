import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useRouter } from 'next/navigation'
import { ReactNode, RefObject, useEffect, useState } from 'react'

type Props = {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  scrollRef?: RefObject<HTMLDivElement>
  // components?: { OverlayComponent?: () => ReactElement | null }
}

export const OuterScrollable = ({
  title,
  description,
  children,
  className,
  scrollRef,
}: // components: { OverlayComponent } = {},
Props) => {
  const [open, setOpen] = useState(true)
  const [disableEsc, setDisableEsc] = useState(false)
  const router = useRouter()
  useEffect(() => {
    window.addEventListener('lightbox-open', () => {
      setDisableEsc(true)
    })

    window.addEventListener('lightbox-close', () => {
      setDisableEsc(false)
    })

    return () => {
      window.removeEventListener('lightbox-open', () => {})
      window.removeEventListener('lightbox-close', () => {})
    }
  }, [])

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = ''
      }, 0)

      return () => clearTimeout(timer)
    } else {
      document.body.style.pointerEvents = 'auto'
    }
  }, [open])

  const handleOpenChange = (isOpen: boolean) => {
    if (disableEsc) return
    setOpen(isOpen)
    router.back()
  }

  return (
    <Dialog defaultOpen={true} open={open} onOpenChange={handleOpenChange}>
      {/* <DialogTrigger className={triggerClass}>open</DialogTrigger> */}
      <DialogTrigger>open</DialogTrigger>
      <DialogPortal>
        <DialogOverlay
          ref={scrollRef}
          className="fixed top-0 left-0 right-0 bottom-0 flex overflow-auto items-start justify-center bg-red-500"
        >
          {/* <DialogContent className={contentInScrollableOverlayClass}> */}
          {/* <DialogContent className='fixed top-0 left-0 min-w-[300px] min-h-[150px] p-6 rounded-md bg-gray-400 shadow-md mt-12 mb-12'> */}
          <DialogPrimitive.Content className={cn('mx-12', className)}>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            {children}
            {/* <DialogClose className={closeClass}>close</DialogClose> */}
            <DialogClose>close</DialogClose>
          </DialogPrimitive.Content>
          {/* </DialogContent> */}
        </DialogOverlay>
      </DialogPortal>
    </Dialog>
  )
}
