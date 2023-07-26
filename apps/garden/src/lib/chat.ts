import { ChatMessage, ChatMessageGroup } from '@/lib/types'

export const compilePrompt = (
  characterName: string,
  message: ChatMessage,
  description?: string,
  dialogue?: string,
): string => {
  let compiled = description || ''
  compiled += '\n\n'
  compiled += dialogue ? dialogue : ''
  compiled += `${message.sender}: ${message.message}\n`
  compiled += `${characterName}:`
  compiled = compiled.replaceAll('{{char}}', characterName)
  return compiled
}

export const messageGroupsToDialogueString = (
  messageGroups: ChatMessageGroup[],
) => {
  let compiled = ''
  messageGroups.forEach(messageGroup => {
    messageGroup.forEach(message => {
      compiled += `${message.sender}: ${message.message}\n`
    })
    compiled += '\n'
  })
  return compiled
}
