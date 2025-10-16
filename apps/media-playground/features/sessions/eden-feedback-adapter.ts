'use client'

import { FeedbackAdapter } from '@assistant-ui/react'
import axios from 'axios'

const edenFeedbackAdapter: FeedbackAdapter = {
  submit: async feedback => {
    const { message, type } = feedback

    try {
      await axios.post(`/api/threads/react`, {
        message_id: message.id,
        reaction: type === 'positive' ? 'thumbs_up' : 'thumbs_down',
      })
    } catch (e) {
      console.error(e)
    }
  },
}

export default edenFeedbackAdapter
