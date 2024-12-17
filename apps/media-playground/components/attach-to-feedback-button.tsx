'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import * as Sentry from '@sentry/nextjs'
import { feedbackIntegration } from '@sentry/nextjs'
import { MessageCircleWarningIcon } from 'lucide-react'
import { FC, useEffect, useRef, useState } from 'react'

type Props = {
  className?: string
}

const AttachToFeedbackButton: FC<Props> = ({ className }) => {
  const [feedback, setFeedback] =
    useState<ReturnType<typeof feedbackIntegration>>()
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setFeedback(Sentry.getFeedback())
  }, [])

  useEffect(() => {
    let unsubscribe: () => void

    if (feedback && buttonRef && buttonRef.current) {
      unsubscribe = feedback.attachTo(buttonRef.current)
    }

    return () => {
      unsubscribe && unsubscribe()
    }
  }, [feedback])

  return (
    <Button
      data-test-id="sentry-feedback-trigger-anchor"
      variant="outline"
      size={'sm'}
      type="button"
      ref={buttonRef}
      className={cn(['text-sm', className])}
    >
      <MessageCircleWarningIcon className="w-5 h-5 mr-2 md:mr-0 lg:mr-2" />
      <div className="block md:hidden lg:block">Feedback</div>
    </Button>
  )
}

export default AttachToFeedbackButton
