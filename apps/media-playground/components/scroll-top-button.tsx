'use client'

import { Button } from '@/components/ui/button'
import { useWindowScroll } from '@/hooks/use-window-scroll'
import { ArrowUpIcon } from 'lucide-react'

const ScrollTopButton = () => {
  const [scroll, scrollTo] = useWindowScroll()

  if (scroll.y < 700) {
    return null
  }

  return (
    <div className="flex justify-center w-full fixed bottom-2 pointer-events-none">
      <Button
        data-test-id="scroll-top-button"
        variant="outline"
        size="icon"
        className="rounded-full sticky left-4 bottom-4 pointer-events-auto"
        onClick={() => scrollTo({ top: 0 })}
      >
        <ArrowUpIcon className="h-5 w-5" />
      </Button>
    </div>
  )
}

export default ScrollTopButton
