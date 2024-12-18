'use client'

import { FeedbackAdapter } from '@assistant-ui/react'

const edenFeedbackAdapter: FeedbackAdapter = {
  submit: async feedback => {
    const { message, type } = feedback
    console.log('submit feedback', { message, type })

    //@todo: call api
  },
}

export default edenFeedbackAdapter
