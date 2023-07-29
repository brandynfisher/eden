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
  compiled = compileMessage(compiled, [
    { marker: '{{char}}', replacement: characterName },
  ])
  return compiled
}

export type MessageMarker = {
  marker: '{{user}}' | '{{char}}'
  replacement: string
}

export const compileMessage = (
  completion: string,
  markers: MessageMarker[],
) => {
  let compiledCompletion = completion

  markers.map(marker => {
    compiledCompletion = compiledCompletion.replaceAll(
      marker.marker,
      marker.replacement,
    )
  })

  return compiledCompletion
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

export const dialogueStringToMessageGroups = (dialogue: string) => {
  const lines = dialogue.replace('\n\n', '').split('\n')

  const messageGroups: ChatMessageGroup[] = []
  let messageGroup: ChatMessageGroup = []
  lines.map(line => {
    const senderMatch = line.match(/{{(user|char)}}/)
    const message = line.replace(/{{(user|char)}}: /, '').replace('\n', '')

    if (!senderMatch) {
      return
    }

    messageGroup.push({ sender: senderMatch[0], message })

    if (messageGroup.length < 2) {
      messageGroups.push(messageGroup)
    } else {
      messageGroup = []
    }
  })

  return messageGroups
}
