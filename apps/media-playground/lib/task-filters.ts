import { TaskV2, ToolOutputTypeV2 } from '@edenlabs/eden-sdk'

const MEDIA_OUTPUT_TYPES = new Set<ToolOutputTypeV2>([
  'image',
  'video',
  'audio',
  'lora',
])

const NON_MEDIA_TOOL_KEYS = new Set([
  // Social/media posting tools
  'discord_post',
  'discord_search',
  'discord_broadcast_dm',
  'telegram_post',
  'tweet',
  'twitter_search',
  'twitter_mentions',
  'twitter_trends',
  'Twitter Search',
  'Twitter Mentions',
  'farcaster_cast',
  'farcaster_search',
  'farcaster_mentions',
  'instagram_post',
  'tiktok_post',
  'shopify',
  'printify',
  'email_send',
  'gmail_send',
  'google_calendar_query',
  'google_calendar_edit',
  'google_calendar_delete',

  // Search / JSON / collection helpers
  'web_search',
  'eden_search',
  'display',
  'vote',
  'get_vote',
  'add_to_collection',
])

export const isMediaTimelineTask = (task: TaskV2 | undefined | null) => {
  if (!task) return false
  if (NON_MEDIA_TOOL_KEYS.has(task.tool)) return false
  if (task.output_type && MEDIA_OUTPUT_TYPES.has(task.output_type)) return true

  // Fall back to checking results for any array outputs (media-like)
  return (
    Array.isArray(task.result) &&
    task.result.some(result => Array.isArray(result?.output))
  )
}
