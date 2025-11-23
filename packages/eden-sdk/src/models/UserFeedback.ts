import { WebAPICallOptions, WebAPICallResult } from '../types'
import { AxiosRequestConfig } from 'axios'

export interface UserFeedbackSubmitArguments extends WebAPICallOptions {
  message: string
  subject?: string
  category?: string
}

export type UserFeedbackSubmitResponse = WebAPICallResult & {
  message?: string
  feedbackId?: string
  remainingSubmissionsToday?: number
}

export const userFeedbackSubmitRequestConfig = (
  args: UserFeedbackSubmitArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/user/feedback',
    data: {
      message: args.message,
      subject: args.subject,
      category: args.category,
    },
  }
}
